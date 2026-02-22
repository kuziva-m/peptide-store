export const downloadAusPostCSV = (orders) => {
  // Define headers strictly required by MyPost Business CSV
  const headers = [
    "Order Number",
    "Deliver to Name",
    "Deliver to Phone",
    "Deliver to Email",
    "Deliver to Address Line 1",
    "Deliver to Address Line 2",
    "Deliver to Suburb",
    "Deliver to State",
    "Deliver to Postcode",
    "Deliver to Country",
    "Item Description",
    "Item Weight (kg)",
    "Length (cm)",
    "Width (cm)",
    "Height (cm)",
  ];

  const rows = orders.map((order) => {
    // Basic weight assumption (e.g. 0.5kg) or calculate from items
    const weight = 0.5;

    return [
      order.id.slice(0, 8), // Order Number (Shortened)
      order.customer_name, // Name
      "", // Phone (Optional)
      order.customer_email, // Email
      order.shipping_address.line1, // Address 1
      "", // Address 2
      order.shipping_address.city, // Suburb
      order.shipping_address.state, // State
      order.shipping_address.postal_code, // Postcode
      "AU", // Country
      "Peptides", // Item Description
      weight, // Weight
      20,
      10,
      5, // Dimensions (Standard Box)
    ]
      .map((field) => `"${field}"`)
      .join(","); // Escape commas
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  // Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `AusPost_Import_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
