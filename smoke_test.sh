#!/bin/zsh
BASE="http://localhost:8000/api/v1"

echo "=== LOGIN ==="
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@steel.com&password=admin123")
echo "$LOGIN"
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
AUTH="Authorization: Bearer $TOKEN"

echo ""
echo "=== CREATE COMPANY ==="
COMPANY=$(curl -s -X POST "$BASE/masters/companies" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"JSW Steel","gst_number":"27AABCJ1234A1Z5"}')
echo "$COMPANY"
CID=$(echo "$COMPANY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== CREATE BRANCH ==="
BRANCH=$(curl -s -X POST "$BASE/masters/companies/$CID/branches" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"Mumbai Branch","address":"Andheri East, Mumbai"}')
echo "$BRANCH"
BID=$(echo "$BRANCH" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== CREATE BRAND ==="
BRAND=$(curl -s -X POST "$BASE/masters/brands" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"JSW TMT Fe500","grade":"Fe500","specification":"IS 1786"}')
echo "$BRAND"
RBID=$(echo "$BRAND" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== CREATE CUSTOMER ==="
CUST=$(curl -s -X POST "$BASE/masters/customers" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"Sharma Constructions","phone":"9876543210","gst_number":"27AABCS9999B1Z1"}')
echo "$CUST"
CUSTID=$(echo "$CUST" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== CREATE PURCHASE ORDER (100 tons) ==="
PO=$(curl -s -X POST "$BASE/purchases/" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"company_id\":$CID,\"branch_id\":$BID,\"brand_id\":$RBID,\"order_date\":\"2026-05-13\",\"invoice_number\":\"INV-001\",\"ordered_qty\":100,\"rate_per_ton\":65000}")
echo "$PO"
POID=$(echo "$PO" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== ADD RECEIPT 1 (40 tons) ==="
R1=$(curl -s -X POST "$BASE/purchases/$POID/receipts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"receipt_date":"2026-05-13","received_qty":40,"vehicle_number":"MH04AB1234","lr_number":"LR-001"}')
echo "$R1"
LOTID=$(echo "$R1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stock_lot',{}).get('id',''))")
echo "Lot ID: $LOTID"

echo ""
echo "=== ADD RECEIPT 2 (30 tons) ==="
R2=$(curl -s -X POST "$BASE/purchases/$POID/receipts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"receipt_date":"2026-05-13","received_qty":30,"vehicle_number":"MH04CD5678"}')
echo "$R2"
LOTID2=$(echo "$R2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stock_lot',{}).get('id',''))")
echo "Lot2 ID: $LOTID2"

echo ""
echo "=== CHECK PURCHASE ORDER ==="
curl -s "$BASE/purchases/$POID" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Status: {d[\"status\"]}  Ordered: {d[\"ordered_qty\"]}  Received: {d[\"received_qty\"]}  Pending: {d[\"pending_qty\"]}')
"

echo ""
echo "=== CREATE SALE ORDER (50 tons) ==="
SO=$(curl -s -X POST "$BASE/sales/" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"customer_id\":$CUSTID,\"brand_id\":$RBID,\"order_date\":\"2026-05-13\",\"invoice_number\":\"SINV-001\",\"ordered_qty\":50,\"rate_per_ton\":68000}")
echo "$SO"
SOID=$(echo "$SO" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "=== ADD DISPATCH (25 tons from lot 1) ==="
D1=$(curl -s -X POST "$BASE/sales/$SOID/dispatches" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"dispatch_date\":\"2026-05-13\",\"dispatched_qty\":25,\"vehicle_number\":\"MH04EF9012\",\"challan_number\":\"CH-001\",\"allocations\":[{\"stock_lot_id\":$LOTID,\"allocated_qty\":25}]}")
echo "$D1"

echo ""
echo "=== CHECK SALE ORDER ==="
curl -s "$BASE/sales/$SOID" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Status: {d[\"status\"]}  Ordered: {d[\"ordered_qty\"]}  Dispatched: {d[\"dispatched_qty\"]}  Pending: {d[\"pending_qty\"]}')
"

echo ""
echo "=== DASHBOARD ==="
curl -s "$BASE/stock/dashboard" -H "$AUTH" | python3 -m json.tool

echo ""
echo "=== STOCK LOTS ==="
curl -s "$BASE/stock/lots" -H "$AUTH" | python3 -c "
import sys,json
lots=json.load(sys.stdin)
for l in lots:
    print(f'  Lot {l[\"lot_number\"]}: received={l[\"received_qty\"]}T  available={l[\"available_qty\"]}T')
"
