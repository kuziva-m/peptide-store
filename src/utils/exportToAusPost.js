export const downloadAusPostCSV = (orders) => {
  // Exact headers recognized by Australia Post MyPost Business
  const headers = [
    "Order Number",
    "Deliver to Name",
    "Deliver to Address Line 1",
    "Deliver to Address Line 2",
    "Deliver to Suburb",
    "Deliver to State",
    "Deliver to Postcode",
    "Deliver to Email",
    "Deliver to Phone",
    "Dangerous Goods Declaration",
    "Weight (kg)",
    "Length (cm)",
    "Width (cm)",
    "Height (cm)",
    "Service",
  ];

  const rows = orders.map((order) => {
    // Map your database shipping method to AusPost's exact service names
    const isExpress = order.shipping_method?.toLowerCase() === "express";
    const serviceType = isExpress ? "Express Post" : "Parcel Post";

    // Safely extract phone number
    const phone = order.shipping_address?.phone || "";

    return [
      order.id.slice(0, 8), // Order Number
      order.customer_name || "", // Deliver to Name
      order.shipping_address?.line1 || "", // Deliver to Address Line 1
      order.shipping_address?.line2 || "", // Deliver to Address Line 2
      order.shipping_address?.city || "", // Deliver to Suburb
      order.shipping_address?.state || "", // Deliver to State
      order.shipping_address?.postal_code || "", // Deliver to Postcode
      order.customer_email || "", // Deliver to Email
      phone, // Deliver to Phone
      "No", // Dangerous Goods Declaration
      "0.25", // Weight (kg)
      "15", // Length (cm)
      "10", // Width (cm)
      "2", // Height (cm)
      serviceType, // Service (Express Post or Parcel Post)
    ]
      .map((field) => {
        // Safely escape any commas or quotes that might be in an address line
        const stringField = String(field || "").replace(/"/g, '""');
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
    `AusPost_Import_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
