/* eslint-disable */
export const CSV_TEMPLATE = {
  delivery_note: `"ID","Series","Customer","Company","Date","Posting Time","Status","Set Source Warehouse","Price List","Price List Exchange Rate","Exchange Rate","Price List Currency","Currency","Item Code (Items)","Item Name (Items)","Description (Items)","Quantity (Items)","Amount (Items)","UOM (Items)","Stock UOM (Items)","UOM Conversion Factor (Items)","Against Sales Invoice (Items)","Serial No (Items)","Rate (Items)"
  `,

  purchase_receipt: `"ID","Series","Supplier","Date","Posting Time","Company","Currency","Exchange Rate","Net Total (Company Currency)","Status","Item Code (Items)","Item Name (Items)","Description (Items)","Received Quantity (Items)","Accepted Quantity (Items)","UOM (Items)","Stock UOM (Items)","Conversion Factor (Items)","Rate (Company Currency) (Items)","Accepted Warehouse (Items)","Rejected Warehouse (Items)","Serial No (Items)","Purchase Order (Items)"
  `,

  delivery_note_legacy : `Data Import Template,,,,,,,,,,,,,,,,,,,,,,,,,,
  Table:,Delivery Note,,,,,,,,,,,,,,,,,,,,,,,,,
  DocType:,Delivery Note,,,,,,,,,,,,~,Delivery Note Item,items,,,,,,~,~,~,~,Sales Team,sales_team
  Column Labels:,Series,Customer,Company,Date,Posting Time,Status,Set Source Warehouse,Total Quantity,Total,Price List,Price List Currency,Price List Exchange Rate,,Item Code,Item Name,Quantity,Amount,Against Sales Invoice,Serial No,Rate,,,,,Sales Person,
  Column Name:,naming_series,customer,company,posting_date,posting_time,status,set_warehouse,total_qty,total,selling_price_list,price_list_currency,plc_conversion_rate,~,item_code,item_name,qty,amount,against_sales_invoice,serial_no,rate,~,~,~,~,sales_person,~
  Mandatory:,Yes,Yes,Yes,Yes,Yes,Yes,No,No,No,Yes,Yes,Yes,,Yes,Yes,Yes,No,No,No,No,,,,,Yes,
  Type:,Select,Link,Link,Date,Time,Select,Link,Float,Float,Link,Link,Float,,Link,Data,Float,Currency,Link,Text,Float,,,,,Link,
  Info:,"One of: DN-, DN-RET-",Valid Customer,Valid Company,dd-mm-yyyy,,"One of: Draft, To Bill, Completed, Cancelled, Closed",Valid Warehouse,,,Valid Price List,Valid Currency,,,Valid Item,,,,Valid Sales Invoice,,,,,,,Valid Sales Person,
  Start entering data below this line,,,,,,,,,,,,,,,,,,,,,,,,,,
`,

  purchase_receipt_legacy: `Data Import Template,,,,,,,,,,,,,,,,,,,,,,,,,
  Table:,Purchase Receipt,,,,,,,,,,,,,,,,,,,,,,,,
  ,,,,,,,,,,,,,,,,,,,,,,,,,
  ,,,,,,,,,,,,,,,,,,,,,,,,,
  Notes:,,,,,,,,,,,,,,,,,,,,,,,,,
  Please do not change the template headings.,,,,,,,,,,,,,,,,,,,,,,,,,
  First data column must be blank.,,,,,,,,,,,,,,,,,,,,,,,,,
  "If you are uploading new records, leave the ""name"" (ID) column blank.",,,,,,,,,,,,,,,,,,,,,,,,,
  "If you are uploading new records, ""Naming Series"" becomes mandatory, if present.",,,,,,,,,,,,,,,,,,,,,,,,,
  Only mandatory fields are necessary for new records. You can delete non-mandatory columns if you wish.,,,,,,,,,,,,,,,,,,,,,,,,,
  "For updating, you can update only selective columns.",,,,,,,,,,,,,,,,,,,,,,,,,
  You can only upload upto 5000 records in one go. (may be less in some cases),,,,,,,,,,,,,,,,,,,,,,,,,
  ,,,,,,,,,,,,,,,,,,,,,,,,,
  DocType:,Purchase Receipt,,,,,,,,,~,Purchase Receipt Item,items,,,,,,,,,,,~,~,~
  Column Labels:,Series,Supplier,Company,Date,Posting Time,Currency,Exchange Rate,Net Total (Company Currency),Status,,Item Code,Item Name,Description,Received Quantity,UOM,Stock UOM,Conversion Factor,Rate,Accepted Warehouse,Rejected Warehouse,Purchase Order,Serial No,,,
  Column Name:,naming_series,supplier,company,posting_date,posting_time,currency,conversion_rate,base_net_total,status,~,item_code,item_name,description,qty,uom,stock_uom,conversion_factor,rate,warehouse,rejected_warehouse,purchase_order,serial_no,~,~,~
  Mandatory:,Yes,Yes,Yes,Yes,Yes,Yes,Yes,Yes,Yes,,Yes,Yes,Yes,Yes,Yes,Yes,Yes,Yes,No,No,No,No,,,
  Type:,Select,Link,Link,Date,Time,Link,Float,Currency,Select,,Link,Data,Text Editor,Float,Link,Link,Float,Currency,Link,Link,Link,Small Text,,,
  Info:,"One of: PREC-RET-, PREC-",Valid Supplier,Valid Company,dd-mm-yyyy,,Valid Currency,,,"One of: Draft, To Bill, Completed, Cancelled, Closed",,Valid Item,,,,Valid UOM,Valid UOM,,,Valid Warehouse,Valid Warehouse,Valid Purchase Order,,,,
  Start entering data below this line,,,,,,,,,,,,,,,,,,,,,,,,,
`
};

export const CSV_TEMPLATE_HEADERS = {
  purchase_receipt: [
    'naming_series',
    'naming_series',
    'supplier',
    'posting_date',
    'posting_time',
    'company',
    'currency',
    'conversion_rate',
    'total',
    'status',
    ['items', '0', 'item_code'],
    ['items', '0', 'item_name'],
    ['items', '0', 'description'],
    ['items', '0', 'qty'],
    ['items', '0', 'qty'],
    ['items', '0', 'uom'],
    ['items', '0', 'stock_uom'],
    ['items', '0', 'conversion_factor'],
    ['items', '0', 'rate'],
    ['items', '0', 'warehouse'],
    ['items', '0', 'warehouse'],
    ['items', '0', 'serial_no'],
    ['items', '0', 'purchase_order'],
  ],
  delivery_note: [
    'naming_series',
    'naming_series',
    'customer',
    'company',
    'posting_date',
    'posting_time',
    'status',
    'set_warehouse',
    'selling_price_list',
    'plc_conversion_rate',
    'plc_conversion_rate',
    'price_list_currency',
    'price_list_currency',
    ['items', '0', 'item_code'],
    ['items', '0', 'item_name'],
    ['items', '0', 'item_name'],
    ['items', '0', 'qty'],
    ['items', '0', 'amount'],
    ['items', '0', 'uom'],
    ['items', '0', 'stock_uom'],
    ['items', '0', 'conversion_factor'],
    ['items', '0', 'against_sales_invoice'],
    ['items', '0', 'serial_no'],
    ['items', '0', 'rate'],
  ],

  purchase_receipt_legacy : [
    'Column Name:',
    'naming_series',
    'supplier',
    'company',
    'posting_date',
    'posting_time',
    'currency',
    'conversion_rate',
    'base_net_total',
    'status',
    '~',
    ['items', '0', 'item_code'],
    ['items', '0', 'item_name'],
    ['items', '0', 'description'],
    ['items', '0', 'qty'],
    ['items', '0', 'uom'],
    ['items', '0', 'stock_uom'],
    ['items', '0', 'conversion_factor'],
    ['items', '0', 'rate'],
    ['items', '0', 'warehouse'],
    ['items', '0', 'rejected_warehouse'],
    ['items', '0', 'purchase_order'],
    ['items', '0', 'serial_no'],
    '~',
    '~',
    '~',
  ],

  delivery_note_legacy: [
    '',
    'naming_series',
    'customer',
    'company',
    'posting_date',
    'posting_time',
    'status',
    'set_warehouse',
    'total_qty',
    'total',
    'selling_price_list',
    'price_list_currency',
    'plc_conversion_rate',
    '~',
    ['items', '0', 'item_code'],
    ['items', '0', 'item_name'],
    ['items', '0', 'qty'],
    ['items', '0', 'amount'],
    ['items', '0', 'against_sales_invoice'],
    ['items', '0', 'serial_no'],
    ['items', '0', 'rate'],
    '~',
    '~',
    '~',
    '~',
    'sales_person',
    '~',
  ]
};
