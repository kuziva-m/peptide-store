export const downloadAusPostCSV = (orders) => {
  // Exact headers recognized by Australia Post MyPost Business (Strictly Case Sensitive)
  const headers = [
    "Customer Reference 1",
    "Deliver To Name",
    "Deliver To Address Line 1",
    "Deliver To Address Line 2",
    "Deliver To Suburb",
    "Deliver To State",
    "Deliver To Postcode",
    "Deliver To Email Address",
    "Deliver To Phone Number",
    "Dangerous Goods Declaration",
    "Item Description",
    "Item Weight (kg)",
    "Item Length (cm)",
    "Item Width (cm)",
    "Item Height (cm)",
    "Service",
  ];

  const rows = orders.map((order) => {
    // Map your database shipping method to AusPost's exact service names
    const isExpress = order.shipping_method?.toLowerCase() === "express";
    const serviceType = isExpress ? "Express Post" : "Parcel Post";

    // Safely extract phone number
    const phone = order.shipping_address?.phone || "";

    return [
      order.id.slice(0, 8), // Customer Reference 1
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
      "No", // Dangerous Goods Declaration
      "Peptides", // Item Description
      "0.25", // Item Weight (kg)
      "15", // Item Length (cm)
      "10", // Item Width (cm)
      "2", // Item Height (cm)
      serviceType, // Service (Express Post or Parcel Post)
    ]
      .map((field) => {
        // If the field is actually undefined or null, force it to be an empty string
        const cleanField = field === undefined || field === null ? "" : field;
        // Safely escape any commas or quotes that might be in an address line
        const stringField = String(cleanField).replace(/"/g, '""');
        return `"${stringField}"`;
      })
      .join(",");
  });

  // AusPost requires unquoted headers, but correctly handles quoted row data
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `AusPost_Import_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
