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

  const rows = orders.map((order) => {
    // Map to AusPost's exact service codes (EXP = Express, PP = Parcel Post)
    const isExpress = order.shipping_method?.toLowerCase() === "express";
    const serviceCode = isExpress ? "EXP" : "PP";

    // Safely extract phone number
    const phone = order.shipping_address?.phone || "";

    return [
      // --- SENDER INFO (LOCKED) ---
      "Melbourne Peptides", // Send From Name
      "567 Collins St", // Send From Address Line 1
      "Melbourne", // Send From Suburb
      "VIC", // Send From State
      "3000", // Send From Postcode

      // --- RECIPIENT INFO ---
      order.customer_name || "", // Deliver To Name
      order.shipping_address?.line1 || "", // Deliver To Address Line 1
      order.shipping_address?.line2 || "", // Deliver To Address Line 2
      order.shipping_address?.city || "", // Deliver To Suburb
      order.shipping_address?.state || "", // Deliver To State
      order.shipping_address?.postal_code ||
        order.shipping_address?.postcode ||
        order.shipping_address?.zip ||
        "", // Deliver To Postcode
      order.customer_email || "", // Deliver To Email Address
      phone, // Deliver To Phone Number

      // --- PARCEL INFO ---
      "OWN_PACKAGING", // Item Packaging Type
      serviceCode, // Item Delivery Service (EXP or PP)
      "0.25", // Item weight (must be lowercase 'w' as per doc)
      "15", // Item length
      "10", // Item width
      "2", // Item height
      "Peptides", // Item Description
      "NO", // Item Dangerous Goods Flag
      order.id.slice(0, 8), // Additional Label Information 1 (Prints order ID on the label)
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
