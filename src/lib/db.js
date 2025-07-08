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
      datePlanted: harvestData.datePlanted
        ? Timestamp.fromDate(new Date(harvestData.datePlanted))
        : null,
      dateHarvested: harvestData.dateHarvested
        ? Timestamp.fromDate(new Date(harvestData.dateHarvested))
        : null,
      createdAt: Timestamp.now(),
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
      };
    });
  } catch (error) {
    console.error("Error getting seed harvests:", error);
    throw error;
  }
};

export const updateSeedHarvest = async (id, harvestData) => {
  try {
    const docRef = doc(db, "seedHarvests", id);
    await updateDoc(docRef, harvestData);
  } catch (error) {
    throw error;
  }
};

export const deleteSeedHarvest = async (id) => {
  try {
    const docRef = doc(db, "seedHarvests", id);
    await deleteDoc(docRef);
  } catch (error) {
    throw error;
  }
};

export const addSeedDistribution = async (distributionData) => {
  try {
    // 1. Validate and convert dates
    const distributionDate =
      distributionData.date instanceof Date
        ? distributionData.date
        : new Date(distributionData.date);

    if (isNaN(distributionDate.getTime())) {
      throw new Error("Invalid distribution date");
    }

    // 2. Find the harvest record
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

    // 3. Validate quantity
    const quantity = Number(distributionData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error("Invalid distribution quantity");
    }

    // 4. Create distribution record with proper date
    const docRef = await addDoc(collection(db, "seedDistributions"), {
      ...distributionData,
      date: Timestamp.fromDate(distributionDate), // Store as Firestore Timestamp
      quantity: quantity,
      createdAt: Timestamp.now(),
    });

    // 5. Prepare harvest remarks update with proper newline
    const formattedDate = distributionDate.toLocaleDateString();
    const newRemark = `\n[${formattedDate}] Distributed ${quantity}kg to ${distributionData.affiliation} (${distributionData.recipientName}) for ${distributionData.purpose}.`;

    // Ensure existing remarks end with a newline before adding new remark
    const updatedRemarks = harvestData.remarks
      ? `${harvestData.remarks.trimEnd()}\n${newRemark.trim()}`
      : newRemark.trim();

    // 6. Update harvest record
    await updateDoc(doc(db, "seedHarvests", harvestDoc.id), {
      outQuantity: increment(quantity),
      balance: increment(-quantity),
      remarks: updatedRemarks,
      status: "Reduced",
    });

    return docRef.id;
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
    const docRef = doc(db, "seedDistributions", id);
    await updateDoc(docRef, distributionData);
  } catch (error) {
    throw error;
  }
};

export const deleteSeedDistribution = async (distributionId) => {
  try {
    // 1. Get the distribution record first
    const distributionRef = doc(db, "seedDistributions", distributionId);
    const distributionDoc = await getDoc(distributionRef);

    if (!distributionDoc.exists()) {
      throw new Error("Distribution record not found");
    }

    const distributionData = distributionDoc.data();
    const { seedBatchId, quantity } = distributionData;

    // 2. Find the corresponding harvest record
    const harvestQuery = query(
      collection(db, "seedHarvests"),
      where("seedBatchId", "==", seedBatchId)
    );
    const harvestSnapshot = await getDocs(harvestQuery);

    if (harvestSnapshot.empty) {
      throw new Error(`No harvest found with batch ID: ${seedBatchId}`);
    }

    const harvestDoc = harvestSnapshot.docs[0];
    const harvestData = harvestDoc.data();

    // 3. Prepare updated remarks (remove the distribution entry)
    const distributionDate =
      distributionData.date instanceof Timestamp
        ? distributionData.date.toDate().toLocaleDateString()
        : new Date(distributionData.date).toLocaleDateString();

    const remarkToRemove = `\n[${distributionDate}] Distributed ${quantity}kg to ${distributionData.affiliation} (${distributionData.recipientName}) for ${distributionData.purpose}.`;

    const updatedRemarks = harvestData.remarks
      ? harvestData.remarks.replace(remarkToRemove, "").trim()
      : "";

    // 4. Update the harvest record (add back the quantity)
    await updateDoc(doc(db, "seedHarvests", harvestDoc.id), {
      outQuantity: increment(-quantity), // Subtract from outQuantity
      balance: increment(quantity), // Add back to balance
      remarks: updatedRemarks,
      status:
        Number(harvestData.balance) + Number(quantity) > 0
          ? "Active"
          : "Depleted",
    });

    // 5. Finally delete the distribution record
    await deleteDoc(distributionRef);
  } catch (error) {
    console.error("Error deleting distribution:", error);
    throw error;
  }
};

export const getCropHarvestStats = async () => {
  try {
    // Use the modular query syntax
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
