import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper: Check if an item is a consultation charge or lab investigation
function isConsultationOrLabItem(description: string, serviceId?: string | null): boolean {
  if (serviceId) return true;
  const desc = description.toLowerCase().trim();
  if (
    desc.startsWith('consultation') ||
    desc.includes('doctor consultation') ||
    desc.includes('follow-up') ||
    desc.includes('consult') ||
    desc.includes('checkup') ||
    desc.includes('examination')
  ) {
    return true;
  }
  if (
    desc.startsWith('lab') ||
    desc.includes('investigation') ||
    desc.includes('pathology') ||
    desc.includes('radiology') ||
    desc.includes('panel') ||
    desc.includes('blood count') ||
    desc.includes('x-ray') ||
    desc.includes('ultrasound') ||
    desc.includes('ecg') ||
    desc.includes('biochemistry') ||
    desc.includes('urine routine') ||
    desc.includes('lipid profile') ||
    desc.includes('lft') ||
    desc.includes('rft') ||
    desc.includes('hba1c') ||
    desc.includes('fbs')
  ) {
    return true;
  }
  return false;
}

// Helper: Calculate standard quantity from dosage frequency and duration
function parseQuantityFromPrescription(frequency?: string, duration?: string): number {
  if (!frequency && !duration) return 10;

  let days = 5;
  const durLower = (duration || '').toLowerCase();
  if (durLower.includes('3 day')) days = 3;
  else if (durLower.includes('5 day')) days = 5;
  else if (durLower.includes('7 day') || durLower.includes('1 week')) days = 7;
  else if (durLower.includes('10 day')) days = 10;
  else if (durLower.includes('14 day') || durLower.includes('2 week')) days = 14;
  else if (durLower.includes('30 day') || durLower.includes('1 month')) days = 30;
  else {
    const numMatch = durLower.match(/\d+/);
    if (numMatch) {
      const parsed = parseInt(numMatch[0], 10);
      if (!isNaN(parsed) && parsed > 0) days = parsed;
    }
  }

  let dosesPerDay = 2;
  const freqLower = (frequency || '').toLowerCase();
  if (freqLower.includes('1-1-1') || freqLower.includes('thrice') || freqLower.includes('tid') || freqLower.includes('three times')) {
    dosesPerDay = 3;
  } else if (freqLower.includes('1-0-1') || freqLower.includes('twice') || freqLower.includes('bid') || freqLower.includes('two times')) {
    dosesPerDay = 2;
  } else if (freqLower.includes('1-0-0') || freqLower.includes('0-0-1') || freqLower.includes('once') || freqLower.includes('qd') || freqLower.includes('daily')) {
    dosesPerDay = 1;
  } else if (freqLower.includes('q6h') || freqLower.includes('4 times') || freqLower.includes('qid')) {
    dosesPerDay = 4;
  } else if (freqLower.includes('prn') || freqLower.includes('needed') || freqLower.includes('sos')) {
    dosesPerDay = 1;
  }

  return Math.max(1, days * dosesPerDay);
}

// ─── GET: Real-time Live Sync for Pharmacy Station ─────────────────────────
export async function GET() {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const [rawInventoryItems, rawEncounters, rawInvoices, rawPatients] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: {
          clinicId: clinicId!,
          inventoryScope: { in: ['PHARMACY', 'SHARED'] },
        },
        include: {
          category: { select: { name: true } },
          batches: {
            select: { id: true, batchNumber: true, expiryDate: true, quantity: true, unitCost: true },
            orderBy: { receivedDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      prisma.clinicalEncounter.findMany({
        where: {
          clinicId: clinicId!,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          patient: { select: { id: true, name: true, phone: true, fileNumber: true, tags: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      }),
      prisma.invoice.findMany({
        where: {
          clinicId: clinicId!,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          patient: { select: { id: true, name: true, phone: true, fileNumber: true, tags: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
          items: {
            include: {
              inventoryItem: {
                include: {
                  batches: true,
                },
              },
            },
          },
        },
      }),
      prisma.patient.findMany({
        where: { clinicId: clinicId! },
        orderBy: { name: 'asc' },
        take: 100,
        select: { id: true, name: true, phone: true, fileNumber: true, tags: true },
      }),
    ]);

    // Format inventory items
    const inventoryItems = rawInventoryItems.map((item) => {
      let nextExpiry: string | null = null;
      if (item.batches && item.batches.length > 0) {
        const validBatches = item.batches.filter((b) => b.expiryDate !== null);
        if (validBatches.length > 0) {
          const sorted = [...validBatches].sort(
            (a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
          );
          const firstBatch = sorted[0];
          if (firstBatch && firstBatch.expiryDate) {
            nextExpiry = new Date(firstBatch.expiryDate).toLocaleDateString();
          }
        }
      }

      return {
        id: item.id,
        sku: item.sku || 'N/A',
        name: item.name,
        categoryName: item.category?.name || 'General Medication',
        unit: item.unit,
        currentStock: item.currentStock,
        reorderLevel: item.minimumStock || 0,
        salePrice: Number(item.defaultCost || 15),
        batchesCount: item.batches?.length || 0,
        nextExpiry,
        batches: item.batches.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : null,
          quantity: b.quantity,
          unitCost: Number(b.unitCost || item.defaultCost || 0),
        })),
      };
    });

    // Match inventory helper
    const findInventoryMatch = (medicineName: string) => {
      if (!medicineName) return null;
      const nameLower = medicineName.toLowerCase().trim();
      return (
        rawInventoryItems.find((inv) => {
          const invLower = inv.name.toLowerCase().trim();
          return (
            invLower === nameLower ||
            invLower.includes(nameLower) ||
            nameLower.includes(invLower) ||
            invLower.split(' ')[0] === nameLower.split(' ')[0]
          );
        }) || null
      );
    };

    // Patient e-Prescriptions map
    const patientPrescriptionsMap = new Map<string, any[]>();
    for (const enc of rawEncounters) {
      if (!enc.prescriptionsJson) continue;
      const rxList = Array.isArray(enc.prescriptionsJson) ? (enc.prescriptionsJson as any[]) : [];
      if (rxList.length === 0) continue;

      const dateStr = new Date(enc.createdAt).toLocaleDateString();
      const medicines = rxList.map((rx, idx) => {
        const matchedInv = findInventoryMatch(rx.medicineName);
        const availableStock = matchedInv ? matchedInv.currentStock : 0;
        const firstBatch = matchedInv?.batches?.[0];
        const batchNumber = firstBatch?.batchNumber || undefined;
        const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate).toLocaleDateString() : undefined;
        const unitPrice = Number(matchedInv?.defaultCost || 0);
        const qty = Number(rx.quantity) || parseQuantityFromPrescription(rx.frequency, rx.duration);
        const isDispensed = Boolean(rx.isDispensed);

        return {
          id: rx.id || `rx-med-${enc.id}-${idx}`,
          name: rx.medicineName || 'Medication',
          dosage: rx.dosage || 'Standard',
          frequency: rx.frequency || 'As prescribed',
          duration: rx.duration || 'Standard',
          route: rx.route || 'Oral',
          instructions: rx.instructions || '',
          quantity: qty,
          availableStock,
          unitPrice,
          batchNumber,
          expiryDate,
          isDispensed,
          fulfillmentStatus: rx.fulfillmentStatus || (isDispensed ? 'DISPENSED' : 'PENDING'),
        };
      });

      const isAllDispensed = medicines.every((m) => m.fulfillmentStatus === 'DISPENSED');
      if (!isAllDispensed && enc.patientId) {
        const existingList = patientPrescriptionsMap.get(enc.patientId) || [];
        existingList.push({
          encounterId: enc.id,
          doctorId: enc.doctorId || undefined,
          doctorName: enc.doctor?.name || 'Attending Physician',
          doctorSpecialty: enc.doctor?.specialty || 'Consultant',
          prescriptionNumber: `RX-${enc.id.slice(-6).toUpperCase()}`,
          date: dateStr,
          medicines,
        });
        patientPrescriptionsMap.set(enc.patientId, existingList);
      }
    }

    // Format sales / dispensed receipts
    const prescriptions: any[] = [];
    for (const inv of rawInvoices) {
      const pureMedItems = inv.items.filter((it) => !isConsultationOrLabItem(it.description, it.serviceId));
      if (pureMedItems.length === 0) continue;

      const dateStr = new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isDispensed = inv.status === 'PAID' || inv.invoiceNumber.startsWith('PHARM-') || Number(inv.paidAmount) >= Number(inv.totalAmount);
      const saleStatus = isDispensed ? 'DISPENSED' : inv.status === 'PARTIALLY_PAID' ? 'PARTIALLY_DISPENSED' : 'DISPENSED';
      const isWalkIn = !inv.patient?.fileNumber || (inv.patient?.tags && inv.patient.tags.includes('WALK_IN_CUSTOMER')) || (inv.patient?.phone && inv.patient.phone.startsWith('walkin'));
      const displayPhone = inv.patient?.phone && !inv.patient.phone.startsWith('walkin') ? inv.patient.phone : '';

      const medicines = pureMedItems.map((it, idx) => {
        const matchedInv = it.inventoryItem || findInventoryMatch(it.description);
        const availableStock = matchedInv ? matchedInv.currentStock : 0;
        const firstBatch = matchedInv?.batches?.[0];
        const batchNumber = firstBatch?.batchNumber || undefined;
        const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate).toLocaleDateString() : undefined;
        const unitPrice = Number(it.unitPrice || matchedInv?.defaultCost || 0);

        return {
          id: it.id || `inv-item-${idx}`,
          name: it.description,
          dosage: 'Standard',
          frequency: 'As prescribed',
          duration: 'Standard',
          route: 'Oral',
          instructions: '',
          quantity: it.quantity || 1,
          availableStock,
          unitPrice,
          batchNumber,
          expiryDate,
          isDispensed: true,
          fulfillmentStatus: saleStatus,
        };
      });

      const totalAmount = medicines.reduce((sum, m) => sum + m.unitPrice * m.quantity, 0);

      prescriptions.push({
        id: inv.id,
        prescriptionNumber: inv.invoiceNumber || `PHARM-${inv.id.slice(-4).toUpperCase()}`,
        patientId: inv.patientId,
        patientName: inv.patient?.name || (isWalkIn ? 'Walk-in Customer' : 'Patient'),
        patientFileNumber: isWalkIn ? null : (inv.patient?.fileNumber || null),
        patientPhone: displayPhone,
        isWalkIn,
        doctorId: inv.doctorId || undefined,
        doctorName: inv.doctor?.name || (isWalkIn ? 'Direct Pharmacy Sale' : 'Attending Physician'),
        doctorSpecialty: inv.doctor?.specialty || (isWalkIn ? 'Point of Sale' : 'Consultant Physician'),
        createdAt: `Today at ${dateStr}`,
        status: saleStatus,
        medicines,
        totalAmount,
      });
    }

    const patients = rawPatients.map((p) => ({
      id: p.id,
      name: p.name || 'Patient',
      phone: p.phone && !p.phone.startsWith('walkin') ? p.phone : '',
      fileNumber: p.fileNumber,
      recentPrescriptions: patientPrescriptionsMap.get(p.id) || [],
    }));

    return NextResponse.json({
      success: true,
      prescriptions,
      inventoryItems,
      patients,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ─── POST: Record Completed Pharmacy Point-of-Sale ─────────────────────────
export async function POST(request: Request) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const body = await request.json();
    const {
      patientId,
      patientName,
      patientPhone,
      customerType,
      doctorId,
      encounterId,
      prescriptionNumber,
      items = [],
      subtotal = 0,
      discountAmount = 0,
      taxAmount = 0,
      totalAmount = 0,
      paymentMethod = 'CASH',
      amountPaid = 0,
      notes = '',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      throw badRequest('At least one item is required for the sale');
    }

    // Generate unique pharmacy invoice number
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `PHARM-${datePrefix}-${randomSuffix}`;

    const validPaymentMethod = ['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE'].includes(paymentMethod)
      ? paymentMethod
      : 'CASH';

    const result = await prisma.$transaction(async (tx) => {
      // 0. Resolve Patient for Walk-in or direct counter sales
      let resolvedPatientId = patientId;
      let resolvedPatientRecord: any = null;
      const isWalkIn = !resolvedPatientId || resolvedPatientId.startsWith('walk-in') || customerType === 'WALK_IN';

      if (isWalkIn) {
        const rawName = (patientName || '').trim() || 'Walk-in Customer';
        const rawPhone = (patientPhone || '').trim();

        if (rawPhone && rawPhone !== 'N/A' && rawPhone !== '0000000000') {
          // Check if patient with this exact phone already exists in the clinic
          let existingPatient = await tx.patient.findFirst({
            where: {
              clinicId: clinicId!,
              phone: rawPhone,
            },
          });

          if (existingPatient) {
            // Update name if generic before
            if (rawName !== 'Walk-in Customer' && (existingPatient.name === 'Walk-in Customer' || !existingPatient.name)) {
              existingPatient = await tx.patient.update({
                where: { id: existingPatient.id },
                data: { name: rawName },
              });
            }
            resolvedPatientId = existingPatient.id;
            resolvedPatientRecord = existingPatient;
          } else {
            // Create new patient record for this walk-in customer with their custom name & phone
            const newPatient = await tx.patient.create({
              data: {
                clinicId: clinicId!,
                name: rawName,
                phone: rawPhone,
                fileNumber: null, // Walk-in customers do NOT have clinic MRN
                tags: ['WALK_IN_CUSTOMER', 'PHARMACY_RETAIL'],
              },
            });
            resolvedPatientId = newPatient.id;
            resolvedPatientRecord = newPatient;
          }
        } else {
          // No phone number provided -> create unique retail record so the customer's actual Name is saved
          const uniquePhoneKey = `walkin-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
          const newPatient = await tx.patient.create({
            data: {
              clinicId: clinicId!,
              name: rawName,
              phone: uniquePhoneKey,
              fileNumber: null, // No MRN
              tags: ['WALK_IN_CUSTOMER', 'PHARMACY_RETAIL'],
            },
          });
          resolvedPatientId = newPatient.id;
          resolvedPatientRecord = newPatient;
        }
      } else {
        resolvedPatientRecord = await tx.patient.findUnique({
          where: { id: resolvedPatientId },
        });
      }

      if (!resolvedPatientId) {
        throw badRequest('Failed to resolve patient account');
      }

      // 1. Create Pharmacy Invoice
      const invoice = await tx.invoice.create({
        data: {
          clinicId: clinicId!,
          invoiceNumber,
          patientId: resolvedPatientId,
          doctorId: doctorId || null,
          issueDate: new Date(),
          status: Number(amountPaid) >= Number(totalAmount) ? 'PAID' : Number(amountPaid) > 0 ? 'PARTIALLY_PAID' : 'ISSUED',
          subtotal: Number(subtotal),
          discountAmount: Number(discountAmount),
          taxAmount: Number(taxAmount || 0),
          totalAmount: Number(totalAmount),
          paidAmount: Number(amountPaid),
          currency: 'SAR',
          notes: notes || (prescriptionNumber ? `Pharmacy Dispensing for Rx #${prescriptionNumber}` : 'Direct Pharmacy Sale'),
          createdById: user.id,
        },
      });

      // 2. Process items
      const processedItems = [];

      for (const it of items) {
        const isExternal = it.isExternalPurchase || it.fulfillmentStatus === 'EXTERNAL_PURCHASE';
        const qty = Number(it.quantity) || 0;
        const unitPrice = Number(it.unitPrice) || 0;
        const itemTotal = isExternal ? 0 : Number(it.totalPrice) || (qty * unitPrice);

        // Always log the item on invoice if it has cost or is dispensed in-house
        let invoiceItem = null;
        if (!isExternal && qty > 0) {
          invoiceItem = await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              inventoryItemId: it.inventoryItemId || null,
              description: it.name || 'Medication Item',
              quantity: qty,
              unitPrice,
              totalPrice: itemTotal,
            },
          });
        }

        // 3. Deduct stock and record stock movement if mapped to an inventory item
        if (!isExternal && it.inventoryItemId && qty > 0) {
          const invItem = await tx.inventoryItem.findUnique({
            where: { id: it.inventoryItemId },
          });

          if (invItem) {
            if (invItem.inventoryScope !== 'PHARMACY' && invItem.inventoryScope !== 'SHARED') {
              throw badRequest(`Item "${invItem.name}" is allocated to ${invItem.inventoryScope} and cannot be dispensed in the Pharmacy.`);
            }

            if (invItem.currentStock < qty) {
              throw badRequest(`Insufficient stock for "${invItem.name}". Current available stock is ${invItem.currentStock}. Please receive stock in Inventory before dispensing.`);
            }

            const previousStock = invItem.currentStock;
            const newStock = Math.max(0, previousStock - qty);

            await tx.inventoryItem.update({
              where: { id: it.inventoryItemId },
              data: { currentStock: newStock },
            });

            // If a specific batch was selected, deduct from batch
            if (it.batchId) {
              const batch = await tx.inventoryBatch.findUnique({
                where: { id: it.batchId },
              });
              if (batch) {
                await tx.inventoryBatch.update({
                  where: { id: it.batchId },
                  data: {
                    quantity: Math.max(0, batch.quantity - qty),
                  },
                });
              }
            }

            // Record stock movement with inventoryScope
            await tx.inventoryStockMovement.create({
              data: {
                clinicId: clinicId!,
                itemId: it.inventoryItemId,
                batchId: it.batchId || null,
                type: 'STOCK_ISSUED',
                inventoryScope: 'PHARMACY',
                quantity: qty,
                previousStock,
                newStock,
                unitCost: unitPrice,
                referenceType: 'PHARMACY_SALE',
                referenceId: invoice.id,
                notes: `Pharmacy Dispensed: ${it.name} (Invoice ${invoice.invoiceNumber})`,
                createdById: user.id,
              },
            });
          }
        }

        processedItems.push({
          ...it,
          invoiceItemId: invoiceItem?.id,
        });
      }

      // 4. Create Payment Transaction if amount paid > 0
      let transaction = null;
      if (Number(amountPaid) > 0) {
        transaction = await tx.paymentTransaction.create({
          data: {
            clinicId: clinicId!,
            invoiceId: invoice.id,
            patientId: resolvedPatientId,
            amount: Number(amountPaid),
            method: validPaymentMethod as any,
            reference: `Sale #${invoiceNumber}`,
            notes: `Pharmacy Point-of-Sale Payment (${validPaymentMethod})`,
            paymentDate: new Date(),
            receivedById: user.id,
          },
        });
      }

      // 5. Update Clinical Encounter Prescriptions if linked
      if (encounterId) {
        const encounter = await tx.clinicalEncounter.findUnique({
          where: { id: encounterId },
        });

        if (encounter && Array.isArray(encounter.prescriptionsJson)) {
          const updatedPrescriptions = (encounter.prescriptionsJson as any[]).map((rx) => {
            const matchedItem = items.find(
              (it) => it.id === rx.id || it.name?.toLowerCase() === rx.medicineName?.toLowerCase()
            );

            if (matchedItem) {
              return {
                ...rx,
                isDispensed: true,
                dispensedQuantity: matchedItem.isExternalPurchase ? 0 : matchedItem.quantity,
                fulfillmentStatus: matchedItem.isExternalPurchase ? 'EXTERNAL_PURCHASE' : 'DISPENSED',
                dispensedAt: new Date().toISOString(),
                pharmacyInvoiceId: invoice.id,
              };
            }
            return rx;
          });

          await tx.clinicalEncounter.update({
            where: { id: encounterId },
            data: {
              prescriptionsJson: updatedPrescriptions,
            },
          });
        }
      }

      return {
        invoice: {
          ...invoice,
          patient: resolvedPatientRecord ? {
            id: resolvedPatientRecord.id,
            name: resolvedPatientRecord.name,
            phone: resolvedPatientRecord.phone?.startsWith('walkin-') ? '' : resolvedPatientRecord.phone,
            fileNumber: resolvedPatientRecord.fileNumber,
            tags: resolvedPatientRecord.tags,
          } : null,
        },
        transaction,
        items: processedItems,
        isWalkIn,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Pharmacy sale completed and stock dispensed successfully',
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

