import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  increment,
  Timestamp,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

// Dashboard Statistics Function
export const getDashboardStats = async () => {
  try {
    // Get all harvests
    const harvestsQuery = query(collection(db, "seedHarvests"));
    const harvestsSnapshot = await getDocs(harvestsQuery);
    const harvests = harvestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all distributions
    const distributionsQuery = query(collection(db, "seedDistributions"));
    const distributionsSnapshot = await getDocs(distributionsQuery);
    const distributions = distributionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate total seeds (sum of all balances)
    const totalSeeds = harvests.reduce(
      (sum, harvest) => sum + (harvest.balance || 0),
      0
    );

    // Get most recent harvest
    const recentHarvest = [...harvests]
      .filter((h) => h.dateHarvested) // Ensure it has a harvest date
      .sort((a, b) => b.dateHarvested.toDate() - a.dateHarvested.toDate())
      .slice(0, 1)[0];

    // Calculate crop quantities
    const cropQuantities = harvests.reduce((acc, harvest) => {
      if (!harvest.crop) return acc;
      acc[harvest.crop] = (acc[harvest.crop] || 0) + (harvest.balance || 0);
      return acc;
    }, {});

    // Find most abundant crop
    let mostAbundantCrop = "N/A";
    let maxQuantity = 0;
    Object.entries(cropQuantities).forEach(([crop, quantity]) => {
      if (quantity > maxQuantity) {
        mostAbundantCrop = crop;
        maxQuantity = quantity;
      }
    });

    return {
      totalSeeds,
      recentHarvest,
      mostAbundantCrop,
      cropQuantities,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

// Get recent seed harvests
export const getRecentHarvests = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, "seedHarvests"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        seedBatchId: data.seedBatchId || doc.id, // Use doc.id if seedBatchId doesn't exist
        area: data.area || 0,
        balance: data.balance || 0,
        classification: data.classification || "",
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        crop: data.crop || "",
        dateHarvested: data.dateHarvested?.toDate() || null,
        datePlanted: data.datePlanted?.toDate() || null,
        germination: data.germination || 0,
        inQuantity: data.inQuantity || 0,
        outQuantity: data.outQuantity || 0,
        remarks: data.remarks || "",
        status: data.status || "Active",
        totalLotArea: data.totalLotArea || 0,
        variety: data.variety || "",
      };
    });
  } catch (error) {
    console.error("Error getting seed harvests:", error);
    throw error;
  }
};

// Get recent seed distributions
export const getRecentDistributions = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, "seedDistributions"),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

export const addSeedHarvest = async (harvestData) => {
  try {
    // Convert date strings to Firestore Timestamps
    const processedData = {
      ...harvestData,
      classification: harvestData.classification || "",
      area: harvestData.area || "",
      datePlanted: harvestData.datePlanted
        ? Timestamp.fromDate(new Date(harvestData.datePlanted))
        : null,
      dateHarvested: harvestData.dateHarvested
        ? Timestamp.fromDate(new Date(harvestData.dateHarvested))
        : null,
      createdAt: Timestamp.now(),
      logs: harvestData.logs || [],
    };

    const docRef = await addDoc(collection(db, "seedHarvests"), processedData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding seed harvest:", error);
    throw error;
  }
};

export const getSeedHarvests = async () => {
  try {
    const q = query(
      collection(db, "seedHarvests"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        seedBatchId: data.seedBatchId || doc.id,
        area: data.area || 0,
        balance: data.balance || 0,
        classification: data.classification || "",
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        crop: data.crop || "",
        dateHarvested: data.dateHarvested?.toDate() || null,
        datePlanted: data.datePlanted?.toDate() || null,
        germination: data.germination || 0,
        inQuantity: data.inQuantity || 0,
        outQuantity: data.outQuantity || 0,
        remarks: data.remarks || "",
        status: data.status || "Active",
        totalLotArea: data.totalLotArea || 0,
        variety: data.variety || "",
        logs: data.logs || [],
      };
    });
  } catch (error) {
    console.error("Error getting seed harvests:", error);
    throw error;
  }
};

export const updateSeedHarvest = async (id, harvestData) => {
  try {
    // First get the current harvest data
    const harvestRef = doc(db, "seedHarvests", id);
    const harvestSnap = await getDoc(harvestRef);

    if (!harvestSnap.exists()) {
      throw new Error("Harvest record not found");
    }

    const currentData = harvestSnap.data();

    // Prepare the update data
    const updateData = {};
    Object.keys(harvestData).forEach((key) => {
      if (harvestData[key] !== undefined) {
        updateData[key] = harvestData[key];
      }
    });

    // If seedBatchId is being updated, we need to update all related distributions
    if (
      updateData.seedBatchId &&
      updateData.seedBatchId !== currentData.seedBatchId
    ) {
      await runTransaction(db, async (transaction) => {
        // Update the harvest record
        transaction.update(harvestRef, updateData);

        // Find all distributions linked to this harvest
        const distributionsQuery = query(
          collection(db, "seedDistributions"),
          where("seedBatchId", "==", currentData.seedBatchId)
        );
        const distributionsSnap = await getDocs(distributionsQuery);

        // Update each distribution with the new seedBatchId
        distributionsSnap.forEach((distDoc) => {
          transaction.update(distDoc.ref, {
            seedBatchId: updateData.seedBatchId,
          });
        });
      });
    } else {
      // Just update the harvest record if seedBatchId isn't changing
      await updateDoc(harvestRef, updateData);
    }
  } catch (error) {
    console.error("Error updating harvest:", error);
    throw error;
  }
};

export const deleteSeedHarvest = async (id) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get the harvest record first
      const harvestRef = doc(db, "seedHarvests", id);
      const harvestSnap = await transaction.get(harvestRef);

      if (!harvestSnap.exists()) {
        throw new Error("Harvest record not found");
      }

      const harvestData = harvestSnap.data();
      const seedBatchId = harvestData.seedBatchId;

      // 2. Find all distributions linked to this harvest through logs
      const distributionsQuery = query(
        collection(db, "seedDistributions"),
        where("seedBatchId", "==", seedBatchId)
      );
      const distributionsSnap = await getDocs(distributionsQuery);

      // 3. Delete all linked distributions
      const batch = writeBatch(db);
      distributionsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4. Execute the batch delete and then delete the harvest
      await batch.commit();
      await transaction.delete(harvestRef);

      return {
        deletedHarvestId: id,
        deletedDistributionIds: distributionsSnap.docs.map((d) => d.id),
      };
    });
  } catch (error) {
    console.error("Error deleting seed harvest:", error);
    throw error;
  }
};

export const addSeedDistribution = async (distributionData) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get the harvest record
      const harvestQuery = query(
        collection(db, "seedHarvests"),
        where("seedBatchId", "==", distributionData.seedBatchId)
      );
      const harvestSnapshot = await getDocs(harvestQuery);

      if (harvestSnapshot.empty) {
        throw new Error(
          `No harvest found with batch ID: ${distributionData.seedBatchId}`
        );
      }

      const harvestDoc = harvestSnapshot.docs[0];
      const harvestData = harvestDoc.data();

      // 2. Validate quantity
      const quantity = Number(distributionData.quantity);
      if (isNaN(quantity)) throw new Error("Invalid quantity");
      if (harvestData.balance < quantity) {
        throw new Error("Insufficient quantity available");
      }

      // 3. Create distribution record
      const distributionRef = doc(collection(db, "seedDistributions"));
      const distributionWithTimestamp = {
        ...distributionData,
        date: Timestamp.fromDate(new Date(distributionData.date)),
        quantity: quantity,
        createdAt: Timestamp.now(),
      };

      // 4. Prepare harvest update with log
      let note;
      if (distributionData.mode === "breeding") {
        note = `Distributed ${quantity}kg for breeding to ${distributionData.requestedBy} (Area: ${distributionData.area})`;
      } else {
        note = `Distributed ${quantity}kg to ${distributionData.recipientName} (${distributionData.affiliation}) for ${distributionData.purpose}`;
      }

      const harvestUpdate = {
        balance: harvestData.balance - quantity,
        outQuantity: (harvestData.outQuantity || 0) + quantity,
        status: harvestData.balance - quantity > 0 ? "Active" : "Depleted",
        logs: [
          ...(harvestData.logs || []),
          {
            date: Timestamp.now(),
            quantity: -quantity,
            note: note,
            mode: distributionData.mode,
            purpose: distributionData.purpose,
            requestedBy: distributionData.requestedBy,
            area: distributionData.area,
            recipientName: distributionData.recipientName,
            affiliation: distributionData.affiliation,
            contactNumber: distributionData.contactNumber,
            distributionId: distributionRef.id,
          },
        ],
      };

      // 5. Perform transaction
      transaction.set(distributionRef, distributionWithTimestamp);
      transaction.update(harvestDoc.ref, harvestUpdate);

      return distributionRef.id;
    });
  } catch (error) {
    console.error("Error adding distribution:", error);
    throw error;
  }
};

export const getSeedDistributions = async () => {
  try {
    const q = query(
      collection(db, "seedDistributions"),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamp to JavaScript Date
      const convertDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp instanceof Timestamp) return timestamp.toDate();
        if (timestamp?.toDate instanceof Function) return timestamp.toDate();
        if (typeof timestamp === "string") {
          const date = new Date(timestamp);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      };

      return {
        id: doc.id,
        ...data,
        date: convertDate(data.date),
        createdAt: convertDate(data.createdAt),
      };
    });
  } catch (error) {
    console.error("Error getting distributions:", error);
    throw error;
  }
};

export const updateSeedDistribution = async (id, distributionData) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get the current distribution record
      const distRef = doc(db, "seedDistributions", id);
      const distSnap = await transaction.get(distRef);

      if (!distSnap.exists()) {
        throw new Error("Distribution record not found");
      }

      const currentDist = distSnap.data();
      const seedBatchId = currentDist.seedBatchId;

      // 2. Get the associated harvest record
      const harvestQuery = query(
        collection(db, "seedHarvests"),
        where("seedBatchId", "==", seedBatchId)
      );
      const harvestSnap = await getDocs(harvestQuery);

      if (harvestSnap.empty) {
        throw new Error(`No harvest found with batch ID: ${seedBatchId}`);
      }

      const harvestDoc = harvestSnap.docs[0];
      const harvestData = harvestDoc.data();

      // 3. Find the log entry in the harvest that corresponds to this distribution
      const logIndex = harvestData.logs?.findIndex(
        (log) => log.distributionId === id
      );

      if (logIndex === -1 || logIndex === undefined) {
        throw new Error("Corresponding log entry not found in harvest record");
      }

      // 4. Calculate quantity difference if quantity is being updated
      const oldQuantity = currentDist.quantity;
      const newQuantity = distributionData.quantity
        ? Number(distributionData.quantity)
        : oldQuantity;

      if (isNaN(newQuantity)) {
        throw new Error("Invalid quantity");
      }

      const quantityDiff = newQuantity - oldQuantity;

      // 5. Check if there's enough balance if increasing quantity
      if (quantityDiff > 0 && harvestData.balance < quantityDiff) {
        throw new Error("Insufficient quantity available for update");
      }

      // 6. Prepare updates
      const updatedLog = {
        ...harvestData.logs[logIndex],
        quantity: -newQuantity,
      };

      // Update log note if relevant fields changed
      if (distributionData.mode === "breeding") {
        if (distributionData.requestedBy) {
          updatedLog.requestedBy = distributionData.requestedBy;
          updatedLog.note = `Distributed ${newQuantity}kg for breeding to ${
            distributionData.requestedBy
          } (Area: ${distributionData.area || updatedLog.area})`;
        }
        if (distributionData.area) {
          updatedLog.area = distributionData.area;
        }
      } else {
        if (distributionData.recipientName || distributionData.affiliation) {
          updatedLog.recipientName =
            distributionData.recipientName || updatedLog.recipientName;
          updatedLog.affiliation =
            distributionData.affiliation || updatedLog.affiliation;
          updatedLog.note = `Distributed ${newQuantity}kg to ${
            updatedLog.recipientName
          } (${updatedLog.affiliation}) for ${
            distributionData.purpose || updatedLog.purpose
          }`;
        }
      }

      if (distributionData.purpose) {
        updatedLog.purpose = distributionData.purpose;
      }

      const updatedLogs = [...harvestData.logs];
      updatedLogs[logIndex] = updatedLog;

      const harvestUpdate = {
        balance: harvestData.balance - quantityDiff,
        outQuantity: (harvestData.outQuantity || 0) + quantityDiff,
        status: harvestData.balance - quantityDiff > 0 ? "Active" : "Depleted",
        logs: updatedLogs,
      };

      // 7. Update both records in a transaction
      transaction.update(distRef, {
        ...distributionData,
        quantity: newQuantity,
      });
      transaction.update(harvestDoc.ref, harvestUpdate);

      return id;
    });
  } catch (error) {
    console.error("Error updating distribution:", error);
    throw error;
  }
};

export const deleteSeedDistribution = async (distributionId) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get the distribution record first
      const distributionRef = doc(db, "seedDistributions", distributionId);
      const distributionSnap = await transaction.get(distributionRef);

      if (!distributionSnap.exists()) {
        throw new Error("Distribution record not found");
      }

      const distributionData = distributionSnap.data();
      const { seedBatchId, quantity } = distributionData;

      // 2. Find the corresponding harvest record
      const harvestQuery = query(
        collection(db, "seedHarvests"),
        where("seedBatchId", "==", seedBatchId)
      );
      const harvestSnap = await getDocs(harvestQuery);

      if (harvestSnap.empty) {
        throw new Error(`No harvest found with batch ID: ${seedBatchId}`);
      }

      const harvestDoc = harvestSnap.docs[0];
      const harvestData = harvestDoc.data();

      // 3. Remove the distribution log entry
      const updatedLogs =
        harvestData.logs?.filter(
          (log) => log.distributionId !== distributionId
        ) || [];

      // 4. Update the harvest record (add back the quantity)
      const harvestUpdate = {
        balance: (harvestData.balance || 0) + quantity,
        outQuantity: (harvestData.outQuantity || 0) - quantity,
        status:
          (harvestData.balance || 0) + quantity > 0 ? "Active" : "Depleted",
        logs: updatedLogs,
      };

      // 5. Perform the updates
      transaction.update(harvestDoc.ref, harvestUpdate);
      transaction.delete(distributionRef);

      return {
        deletedDistributionId: distributionId,
        updatedHarvestId: harvestDoc.id,
      };
    });
  } catch (error) {
    console.error("Error deleting distribution:", error);
    throw error;
  }
};

export const getCropHarvestStats = async () => {
  try {
    const q = query(collection(db, "seedHarvests"));
    const querySnapshot = await getDocs(q);

    const harvests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group by crop and sum quantities
    const cropStats = harvests.reduce((acc, harvest) => {
      if (!harvest.crop) return acc; // Skip if no crop specified

      const existing = acc.find((item) => item.crop === harvest.crop);
      if (existing) {
        existing.total += harvest.balance || 0;
      } else {
        acc.push({
          crop: harvest.crop,
          total: harvest.balance || 0,
        });
      }
      return acc;
    }, []);

    return cropStats;
  } catch (error) {
    console.error("Error getting crop harvest stats:", error);
    return [];
  }
};

export const getHarvestTrends = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, "seedHarvests"),
      where("dateHarvested", ">=", Timestamp.fromDate(sixMonthsAgo)),
      orderBy("dateHarvested")
    );

    const querySnapshot = await getDocs(q);
    const harvests = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      dateHarvested: doc.data().dateHarvested?.toDate(),
    }));

    // Group by month
    const monthlyData = harvests.reduce((acc, harvest) => {
      if (!harvest.dateHarvested) return acc;

      const month = harvest.dateHarvested.toLocaleString("default", {
        month: "short",
      });
      const existing = acc.find((item) => item.month === month);

      if (existing) {
        existing.total += harvest.balance || 0;
      } else {
        acc.push({
          month,
          total: harvest.balance || 0,
        });
      }
      return acc;
    }, []);

    return monthlyData;
  } catch (error) {
    console.error("Error getting harvest trends:", error);
    return [];
  }
};

export const getDistributionTrends = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, "seedDistributions"),
      where("date", ">=", Timestamp.fromDate(sixMonthsAgo)),
      orderBy("date")
    );

    const querySnapshot = await getDocs(q);
    const distributions = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      date: doc.data().date?.toDate(),
    }));

    // Group by month
    const monthlyData = distributions.reduce((acc, dist) => {
      if (!dist.date) return acc;

      const month = dist.date.toLocaleString("default", { month: "short" });
      const existing = acc.find((item) => item.month === month);

      if (existing) {
        existing.total += dist.quantity || 0;
      } else {
        acc.push({
          month,
          total: dist.quantity || 0,
        });
      }
      return acc;
    }, []);

    return monthlyData;
  } catch (error) {
    console.error("Error getting distribution trends:", error);
    return [];
  }
};

export const fetchHarvestByBatchId = async (seedBatchId) => {
  try {
    const q = query(
      collection(db, "seedHarvests"),
      where("seedBatchId", "==", seedBatchId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      seedBatchId: data.seedBatchId,
      crop: data.crop,
      variety: data.variety,
      classification: data.classification,
      dateHarvested: data.dateHarvested?.toDate(),
      germination: data.germination,
      inQuantity: data.inQuantity,
      balance: data.balance,
    };
  } catch (error) {
    console.error("Error fetching harvest by batch ID:", error);
    throw error;
  }
};
