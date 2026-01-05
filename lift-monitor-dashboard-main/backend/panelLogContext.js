import prisma from "./prismaClient.js";

const sampleLogs = [
  {
    building: "PRESTIGE POLYGON",
    date: "2025-11-10",
    time: "00:00",
    htPanel: {
      voltageFromWreb: {
        r: "6.5",
        y: "6.7",
        b: "6.7",
      },
      currentAmp: {
        r: "11.7",
        y: "11.7",
        b: "11.7",
        pf: "0.95",
        hz: "50",
      },
      outgoingTr1: {
        currentAmp: {
          r: "5.2",
          y: "5.2",
          b: "4.1",
        },
        windingTemp: {
          r: "9.4",
          y: "9.4",
          b: "9.1",
        },
      },
      outgoingTr2: {
        currentAmp: {
          r: "7.5",
          y: "9.4",
          b: "9.1",
        },
        windingTemp: {
          r: "9.4",
          y: "9.4",
          b: "9.2",
        },
      },
      outgoingTr3: {
        currentAmp: {
          r: "9.4",
          y: "0.1",
          b: "9.9",
        },
        windingTemp: {
          r: "9.7",
          y: "9.7",
          b: "9.9",
        },
      },
    },
    ltPanel: {
      incomer1: {
        voltage: {
          ry: "405",
          yb: "420",
          br: "412",
        },
        currentAmp: {
          r: "340",
          y: "345",
          b: "342",
        },
        tap: "05",
        kwh: "547.5",
      },
      incomer2: {
        voltage: {
          ry: "408",
          yb: "411",
          br: "407",
        },
        currentAmp: {
          r: "650",
          y: "655",
          b: "653",
        },
        tap: "05",
        kwh: "1147.0",
      },
      incomer3: {
        voltage: {
          ry: "405",
          yb: "410",
          br: "407",
        },
        currentAmp: {
          r: "749",
          y: "745",
          b: "738",
        },
        tap: "05",
        kwh: "1193.5",
      },
    },
    shiftIncharge: {
      aShift: {
        name: "Vijay",
        signature: "",
      },
      bShift: {
        name: "Dr. Raj Sound",
        signature: "",
      },
      cShift: {
        name: "",
        signature: "",
      },
    },
    powerFailure: {
      fromHrs: "",
      toHrs: "",
      reason: "",
    },
    remarks: "",
    createdAt: "2025-11-10T00:00:00.000Z",
    updatedAt: "2025-11-10T00:00:00.000Z",
  },
  {
    id: 2,
    building: "PRESTIGE POLYGON",
    date: "2025-11-10",
    time: "02:00",
    htPanel: {
      voltageFromWreb: {
        r: "6.5",
        y: "6.4",
        b: "6.5",
      },
      currentAmp: {
        r: "11.7",
        y: "11.7",
        b: "11.6",
        pf: "0.94",
        hz: "50",
      },
      outgoingTr1: {
        currentAmp: {
          r: "5.2",
          y: "5.2",
          b: "9.6",
        },
        windingTemp: {
          r: "9.4",
          y: "9.4",
          b: "9.6",
        },
      },
      outgoingTr2: {
        currentAmp: {
          r: "7.5",
          y: "9.4",
          b: "9.2",
        },
        windingTemp: {
          r: "9.4",
          y: "9.4",
          b: "9.6",
        },
      },
      outgoingTr3: {
        currentAmp: {
          r: "9.4",
          y: "9.7",
          b: "9.9",
        },
        windingTemp: {
          r: "9.6",
          y: "9.9",
          b: "9.6",
        },
      },
    },
    ltPanel: {
      incomer1: {
        voltage: {
          ry: "408",
          yb: "415",
          br: "414",
        },
        currentAmp: {
          r: "357",
          y: "363",
          b: "363",
        },
        tap: "05",
        kwh: "1406.0",
      },
      incomer2: {
        voltage: {
          ry: "410",
          yb: "416",
          br: "411",
        },
        currentAmp: {
          r: "619",
          y: "601",
          b: "646",
        },
        tap: "05",
        kwh: "1436.5",
      },
      incomer3: {
        voltage: {
          ry: "405",
          yb: "410",
          br: "407",
        },
        currentAmp: {
          r: "748",
          y: "738",
          b: "731",
        },
        tap: "05",
        kwh: "1431.5",
      },
    },
    shiftIncharge: {
      aShift: {
        name: "Vijay",
        signature: "",
      },
      bShift: {
        name: "Dr. Raj Sound",
        signature: "",
      },
      cShift: {
        name: "",
        signature: "",
      },
    },
    powerFailure: {
      fromHrs: "",
      toHrs: "",
      reason: "",
    },
    remarks: "",
    createdAt: "2025-11-10T02:00:00.000Z",
    updatedAt: "2025-11-10T02:00:00.000Z",
  },
  {
    id: 3,
    building: "PRESTIGE POLYGON",
    date: "2025-11-10",
    time: "12:00",
    htPanel: {
      voltageFromWreb: {
        r: "6.8",
        y: "6.8",
        b: "6.8",
      },
      currentAmp: {
        r: "23.9",
        y: "26.4",
        b: "26.6",
        pf: "0.99",
        hz: "50",
      },
      outgoingTr1: {
        currentAmp: {
          r: "65.9",
          y: "9.4",
          b: "9.6",
        },
        windingTemp: {
          r: "9.6",
          y: "11.1",
          b: "12.0",
        },
      },
      outgoingTr2: {
        currentAmp: {
          r: "11.0",
          y: "11.1",
          b: "12.1",
        },
        windingTemp: {
          r: "12.0",
          y: "13.2",
          b: "13.1",
        },
      },
      outgoingTr3: {
        currentAmp: {
          r: "12.6",
          y: "13.2",
          b: "13.1",
        },
        windingTemp: {
          r: "12.4",
          y: "13.6",
          b: "13.2",
        },
      },
    },
    ltPanel: {
      incomer1: {
        voltage: {
          ry: "406",
          yb: "413",
          br: "408",
        },
        currentAmp: {
          r: "631",
          y: "639",
          b: "632",
        },
        tap: "06",
        kwh: "3036.0",
      },
      incomer2: {
        voltage: {
          ry: "409",
          yb: "413",
          br: "411",
        },
        currentAmp: {
          r: "859",
          y: "830",
          b: "830",
        },
        tap: "05",
        kwh: "3369.5",
      },
      incomer3: {
        voltage: {
          ry: "401",
          yb: "407",
          br: "404",
        },
        currentAmp: {
          r: "868",
          y: "847",
          b: "847",
        },
        tap: "05",
        kwh: "3312.5",
      },
    },
    shiftIncharge: {
      aShift: {
        name: "Vijay",
        signature: "",
      },
      bShift: {
        name: "Dr. Raj Sound",
        signature: "",
      },
      cShift: {
        name: "",
        signature: "",
      },
    },
    powerFailure: {
      fromHrs: "",
      toHrs: "",
      reason: "",
    },
    remarks: "",
  },
];

export const initializeSampleData = async () => {
  const count = await prisma.panelLog.count();
  if (count === 0) {
    const logsWithPanelType = sampleLogs.map((log) => ({
      ...log,
      panelType: "BOTH",
    }));
    await prisma.panelLog.createMany({ data: logsWithPanelType });
    console.log("Sample panel logs inserted into database");
  }
};

export const getPanelLogs = async (filters = {}) => {
  const where = {};

  if (filters.building) {
    where.building = filters.building;
  } else if (
    filters.buildings &&
    Array.isArray(filters.buildings) &&
    filters.buildings.length > 0
  ) {
    // Filter by multiple buildings
    where.building = {
      in: filters.buildings,
    };
  }

  if (filters.date) {
    where.date = filters.date;
  }

  if (filters.dateRange) {
    if (filters.dateRange.from && filters.dateRange.to) {
      where.date = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    } else if (filters.dateRange.from) {
      where.date = { gte: filters.dateRange.from };
    } else if (filters.dateRange.to) {
      where.date = { lte: filters.dateRange.to };
    }
  }

  if (filters.time) {
    where.time = filters.time;
  }

  // Fetch all matching logs first
  let logs = await prisma.panelLog.findMany({
    where,
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });

  // Helper to check if HT panel has actual measurement values (not just default "EB")
  const hasActualHTData = (htPanel) => {
    if (!htPanel || typeof htPanel !== "object") return false;

    // Check for actual voltage/current readings (the meaningful data)
    const hasVoltage =
      htPanel.voltageFromWreb?.volt &&
      htPanel.voltageFromWreb.volt !== "" &&
      htPanel.voltageFromWreb.volt !== "-";

    const hasCurrentAmp =
      htPanel.currentAmp &&
      ((htPanel.currentAmp.r &&
        htPanel.currentAmp.r !== "" &&
        htPanel.currentAmp.r !== "-") ||
        (htPanel.currentAmp.y &&
          htPanel.currentAmp.y !== "" &&
          htPanel.currentAmp.y !== "-") ||
        (htPanel.currentAmp.b &&
          htPanel.currentAmp.b !== "" &&
          htPanel.currentAmp.b !== "-"));

    const hasTr1Data =
      htPanel.outgoingTr1?.currentAmp &&
      ((htPanel.outgoingTr1.currentAmp.r &&
        htPanel.outgoingTr1.currentAmp.r !== "" &&
        htPanel.outgoingTr1.currentAmp.r !== "-") ||
        (htPanel.outgoingTr1.currentAmp.y &&
          htPanel.outgoingTr1.currentAmp.y !== "" &&
          htPanel.outgoingTr1.currentAmp.y !== "-") ||
        (htPanel.outgoingTr1.currentAmp.b &&
          htPanel.outgoingTr1.currentAmp.b !== "" &&
          htPanel.outgoingTr1.currentAmp.b !== "-"));

    return hasVoltage || hasCurrentAmp || hasTr1Data;
  };

  // Helper to check if LT panel has actual measurement values
  const hasActualLTData = (ltPanel) => {
    if (!ltPanel || typeof ltPanel !== "object") return false;

    // Check incomer1 for actual readings
    const hasIncomer1 =
      ltPanel.incomer1 &&
      ((ltPanel.incomer1.voltage?.ry &&
        ltPanel.incomer1.voltage.ry !== "" &&
        ltPanel.incomer1.voltage.ry !== "-") ||
        (ltPanel.incomer1.currentAmp?.r &&
          ltPanel.incomer1.currentAmp.r !== "" &&
          ltPanel.incomer1.currentAmp.r !== "-") ||
        (ltPanel.incomer1.kwh &&
          ltPanel.incomer1.kwh !== "" &&
          ltPanel.incomer1.kwh !== "-"));

    const hasIncomer2 =
      ltPanel.incomer2 &&
      ((ltPanel.incomer2.voltage?.ry &&
        ltPanel.incomer2.voltage.ry !== "" &&
        ltPanel.incomer2.voltage.ry !== "-") ||
        (ltPanel.incomer2.currentAmp?.r &&
          ltPanel.incomer2.currentAmp.r !== "" &&
          ltPanel.incomer2.currentAmp.r !== "-") ||
        (ltPanel.incomer2.kwh &&
          ltPanel.incomer2.kwh !== "" &&
          ltPanel.incomer2.kwh !== "-"));

    return hasIncomer1 || hasIncomer2;
  };

  // Post-query filter by panel type (since Prisma can't filter JSON content)
  if (filters.panelType) {
    if (filters.panelType === "HT") {
      logs = logs.filter((log) => hasActualHTData(log.htPanel));
    } else if (filters.panelType === "LT") {
      logs = logs.filter((log) => hasActualLTData(log.ltPanel));
    } else if (filters.panelType === "BOTH") {
      logs = logs.filter(
        (log) => hasActualHTData(log.htPanel) && hasActualLTData(log.ltPanel)
      );
    }
  }

  return logs;
};

export const getPanelLogById = async (id) => {
  return await prisma.panelLog.findUnique({
    where: { id: parseInt(id) },
  });
};

export const getPanelLogsByBuilding = async (building) => {
  return await prisma.panelLog.findMany({
    where: { building },
    orderBy: { createdAt: "desc" },
  });
};

export const getPanelLogsByDate = async (date) => {
  return await prisma.panelLog.findMany({
    where: { date },
    orderBy: { createdAt: "desc" },
  });
};

export const createPanelLog = async (logData) => {
  const { id, ...dataWithoutId } = logData;

  return await prisma.panelLog.create({
    data: dataWithoutId,
  });
};

export const updatePanelLog = async (id, logData) => {
  try {
    // First, get the existing log to merge data
    const existingLog = await prisma.panelLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLog) {
      return null;
    }

    // Prepare the update data - exclude id, createdAt, updatedAt to let Prisma handle them
    const { id: _id, createdAt, updatedAt, ...restLogData } = logData;
    const updateData = { ...restLogData };

    // Helper to check if HT panel has actual measurement values
    const hasActualHTData = (htPanel) => {
      if (!htPanel || typeof htPanel !== "object") return false;
      const hasVoltage =
        htPanel.voltageFromWreb?.volt &&
        htPanel.voltageFromWreb.volt !== "" &&
        htPanel.voltageFromWreb.volt !== "-";
      const hasCurrentAmp =
        htPanel.currentAmp &&
        ((htPanel.currentAmp.r &&
          htPanel.currentAmp.r !== "" &&
          htPanel.currentAmp.r !== "-") ||
          (htPanel.currentAmp.y &&
            htPanel.currentAmp.y !== "" &&
            htPanel.currentAmp.y !== "-") ||
          (htPanel.currentAmp.b &&
            htPanel.currentAmp.b !== "" &&
            htPanel.currentAmp.b !== "-"));
      const hasTr1Data =
        htPanel.outgoingTr1?.currentAmp &&
        ((htPanel.outgoingTr1.currentAmp.r &&
          htPanel.outgoingTr1.currentAmp.r !== "" &&
          htPanel.outgoingTr1.currentAmp.r !== "-") ||
          (htPanel.outgoingTr1.currentAmp.y &&
            htPanel.outgoingTr1.currentAmp.y !== "" &&
            htPanel.outgoingTr1.currentAmp.y !== "-") ||
          (htPanel.outgoingTr1.currentAmp.b &&
            htPanel.outgoingTr1.currentAmp.b !== "" &&
            htPanel.outgoingTr1.currentAmp.b !== "-"));
      return hasVoltage || hasCurrentAmp || hasTr1Data;
    };

    // Helper to check if LT panel has actual measurement values
    const hasActualLTData = (ltPanel) => {
      if (!ltPanel || typeof ltPanel !== "object") return false;
      const hasIncomer1 =
        ltPanel.incomer1 &&
        ((ltPanel.incomer1.voltage?.ry &&
          ltPanel.incomer1.voltage.ry !== "" &&
          ltPanel.incomer1.voltage.ry !== "-") ||
          (ltPanel.incomer1.currentAmp?.r &&
            ltPanel.incomer1.currentAmp.r !== "" &&
            ltPanel.incomer1.currentAmp.r !== "-") ||
          (ltPanel.incomer1.kwh &&
            ltPanel.incomer1.kwh !== "" &&
            ltPanel.incomer1.kwh !== "-"));
      const hasIncomer2 =
        ltPanel.incomer2 &&
        ((ltPanel.incomer2.voltage?.ry &&
          ltPanel.incomer2.voltage.ry !== "" &&
          ltPanel.incomer2.voltage.ry !== "-") ||
          (ltPanel.incomer2.currentAmp?.r &&
            ltPanel.incomer2.currentAmp.r !== "" &&
            ltPanel.incomer2.currentAmp.r !== "-") ||
          (ltPanel.incomer2.kwh &&
            ltPanel.incomer2.kwh !== "" &&
            ltPanel.incomer2.kwh !== "-"));
      return hasIncomer1 || hasIncomer2;
    };

    const now = new Date().toISOString();

    // Merge htPanel - keep existing if new data is empty
    if (hasActualHTData(logData.htPanel)) {
      updateData.htPanel = {
        ...logData.htPanel,
        _updatedAt: now,
        _updatedBy:
          logData.lastUpdatedBy || existingLog.htPanel?._updatedBy || "Unknown",
      };
    } else if (existingLog.htPanel) {
      updateData.htPanel = existingLog.htPanel;
    }

    // Merge ltPanel - keep existing if new data is empty
    if (hasActualLTData(logData.ltPanel)) {
      updateData.ltPanel = {
        ...logData.ltPanel,
        _updatedAt: now,
        _updatedBy:
          logData.lastUpdatedBy || existingLog.ltPanel?._updatedBy || "Unknown",
      };
    } else if (existingLog.ltPanel) {
      updateData.ltPanel = existingLog.ltPanel;
    }

    // Update panelType based on what panels exist after merge
    const hasHT = hasActualHTData(updateData.htPanel);
    const hasLT = hasActualLTData(updateData.ltPanel);

    if (hasHT && hasLT) {
      updateData.panelType = "BOTH";
    } else if (hasHT) {
      updateData.panelType = "HT";
    } else if (hasLT) {
      updateData.panelType = "LT";
    }

    // Merge other fields - keep existing if not provided
    if (!updateData.shiftIncharge && existingLog.shiftIncharge) {
      updateData.shiftIncharge = existingLog.shiftIncharge;
    }
    if (!updateData.remarks && existingLog.remarks) {
      updateData.remarks = existingLog.remarks;
    }
    if (
      (!updateData.powerFailure ||
        (Array.isArray(updateData.powerFailure) &&
          updateData.powerFailure.length === 0)) &&
      existingLog.powerFailure
    ) {
      updateData.powerFailure = existingLog.powerFailure;
    }

    // Always update lastUpdatedBy if provided
    if (logData.lastUpdatedBy) {
      updateData.lastUpdatedBy = logData.lastUpdatedBy;
    }

    return await prisma.panelLog.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating panel log:", error);
    return null;
  }
};

export const deletePanelType = async (id, panelType) => {
  try {
    const log = await prisma.panelLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!log) {
      return { success: false, deleted: false };
    }

    const hasHT = log.htPanel !== null;
    const hasLT = log.ltPanel !== null;

    if (panelType === "HT" && hasLT) {
      await prisma.panelLog.update({
        where: { id: parseInt(id) },
        data: { htPanel: null, panelType: "LT" },
      });
      return { success: true, deleted: false };
    }

    if (panelType === "LT") {
      await prisma.panelLog.update({
        where: { id: parseInt(id) },
        data: { ltPanel: null, panelType: "HT" },
      });
      return { success: true, deleted: false };
    }

    await prisma.panelLog.delete({
      where: { id: parseInt(id) },
    });
    return { success: true, deleted: true };
  } catch (error) {
    console.error("Error deleting panel type:", error);
    return { success: false, deleted: false };
  }
};

export const deletePanelLog = async (id) => {
  try {
    await prisma.panelLog.delete({
      where: { id: parseInt(id) },
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteAllPanelLogs = async () => {
  await prisma.panelLog.deleteMany();
  return true;
};
