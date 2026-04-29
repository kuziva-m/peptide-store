export const downloadAusPostCSV = (orders) => {
  // Exact headers strictly required by the Australia Post Domestic Bulk Import Template
  const headers = [
    "Send From Name",
    "Send From Address Line 1",
    "Send From Suburb",
    "Send From State",
    "Send From Postcode",
    "Deliver To Name",
    "Deliver To Address Line 1",
    "Deliver To Address Line 2",
    "Deliver To Suburb",
    "Deliver To State",
    "Deliver To Postcode",
    "Deliver To Email Address",
    "Send tracking email to recipient", // 🚨 The exact header AusPost looks for
    "Deliver To Phone Number",
    "Item Packaging Type",
    "Item Delivery Service",
    "Item weight",
    "Item length",
    "Item width",
    "Item height",
    "Item Description",
    "Item Dangerous Goods Flag",
    "Additional Label Information 1",
  ];

  // Helper function to force state strings into exact AusPost formatting
  const formatState = (stateStr) => {
    if (!stateStr) return "";
    let s = stateStr.trim().toUpperCase();

    // Map full names to abbreviations
    const stateMap = {
      VICTORIA: "VIC",
      "NEW SOUTH WALES": "NSW",
      QUEENSLAND: "QLD",
      "SOUTH AUSTRALIA": "SA",
      "WESTERN AUSTRALIA": "WA",
      TASMANIA: "TAS",
      "NORTHERN TERRITORY": "NT",
      "AUSTRALIAN CAPITAL TERRITORY": "ACT",
    };

    if (stateMap[s]) s = stateMap[s];
    return s.slice(0, 3); // Strictly enforce 3 character limit
  };

  const rows = orders.map((order) => {
    // Map to AusPost's exact service codes (EXP = Express, PP = Parcel Post)
    const isExpress = order.shipping_method?.toLowerCase() === "express";
    const serviceCode = isExpress ? "EXP" : "PP";

    // Clean up basic string fields
    const phone = (order.shipping_address?.phone || "").trim().slice(0, 20);
    const name = (order.customer_name || "").trim().slice(0, 35);
    const email = (order.customer_email || "").trim();

    // 🚨 Strict validation: AusPost will uncheck the box if the email is missing or invalid
    const isValidEmail = email && email.includes("@") && email.includes(".");

    // Clean up location strings to fix destination match errors
    const suburb = (order.shipping_address?.city || "").trim().slice(0, 40);
    const state = formatState(order.shipping_address?.state);
    const rawPostcode =
      order.shipping_address?.postal_code ||
      order.shipping_address?.postcode ||
      order.shipping_address?.zip ||
      "";
    const postcode = String(rawPostcode).trim().slice(0, 4);

    // Smart Address Line Splitter (AusPost has a strict 40 char limit per line)
    let line1 = (order.shipping_address?.line1 || "").trim();
    let line2 = (order.shipping_address?.line2 || "").trim();

    if (line1.length > 40) {
      if (!line2) {
        // Push the overflow into line2 if it's empty
        line2 = line1.substring(40).trim().substring(0, 40);
      }
      line1 = line1.substring(0, 40).trim();
    }

    return [
      // --- SENDER INFO (LOCKED) ---
      "MP Research", // Send From Name
      "567 Collins St", // Send From Address Line 1
      "Melbourne", // Send From Suburb
      "VIC", // Send From State
      "3000", // Send From Postcode

      // --- RECIPIENT INFO ---
      name, // Deliver To Name
      line1, // Deliver To Address Line 1
      line2, // Deliver To Address Line 2
      suburb, // Deliver To Suburb
      state, // Deliver To State
      postcode, // Deliver To Postcode
      email, // Deliver To Email Address
      isValidEmail ? "TRUE" : "FALSE", // 🚨 MAGIC FIX: Changed to TRUE/FALSE Boolean format!
      phone, // Deliver To Phone Number

      // --- PARCEL INFO ---
      "OWN_PACKAGING", // Item Packaging Type
      serviceCode, // Item Delivery Service (EXP or PP)
      "0.25", // Item weight (must be lowercase 'w' as per doc)
      "15", // Item length
      "10", // Item width
      "2", // Item height
      " ", // Item Description
      "NO", // Item Dangerous Goods Flag
      String(order.id || "").slice(0, 8), // Additional Label Information 1
    ]
      .map((field) => {
        // Force null/undefined to empty string
        const cleanField = field === undefined || field === null ? "" : field;
        // Escape quotes to prevent CSV breakage
        const stringField = String(cleanField).replace(/"/g, '""');
        return `"${stringField}"`;
      })
      .join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  // Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `AusPost_Domestic_Bulk_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
