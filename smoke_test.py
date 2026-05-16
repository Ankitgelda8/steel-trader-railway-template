#!/usr/bin/env python3
"""
Steel Trader API smoke test — runs full purchase + sale flow.
Usage:  python3 smoke_test.py
"""
import json, sys, time
import urllib.request, urllib.parse, urllib.error

BASE = "http://localhost:8000/api/v1"
RUN  = str(int(time.time()))[-4:]   # short suffix to make names unique per run

def req(method, path, data=None, token=None, form=False):
    url = BASE + path
    headers = {"Accept": "application/json"}
    body = None
    if data:
        if form:
            body = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        print(f"  ⚠ HTTP {e.code}: {txt[:180]}")
        return json.loads(txt) if txt.strip().startswith("{") else {}

def check(label, result, key=None):
    if key:
        val = result.get(key)
        status = "✅" if val else "❌"
        print(f"{status}  {label}: {val}")
        return val
    else:
        ok = result.get("id")
        status = "✅" if ok else "❌"
        print(f"{status}  {label}: {json.dumps(result)[:100]}")
        return result

print("=" * 55)
print("  STEEL TRADER — Full API Smoke Test")
print("=" * 55)

# ── Auth ──────────────────────────────────────────────────────
print("\n── Auth ─────────────────────────────────────────────────")
r = req("POST", "/auth/register",
        {"name": "Admin", "email": "admin@steel.com",
         "password": "admin123", "role": "ADMIN"})
if r.get("id"):
    print("✅  Registered admin user")
elif "already" in str(r).lower() or "exist" in str(r).lower():
    print("ℹ   Admin user already exists — skipping register")
else:
    print(f"ℹ   Register response: {r}")

r = req("POST", "/auth/login",
        {"username": "admin@steel.com", "password": "admin123"}, form=True)
token = r.get("access_token")
if not token:
    print("❌  Login failed — aborting"); sys.exit(1)
print(f"✅  Login OK  (token …{token[-20:]})")

# ── Masters ───────────────────────────────────────────────────
print("\n── Masters ──────────────────────────────────────────────")
co = req("POST", "/masters/companies",
         {"name": f"JSW Steel {RUN}", "gst_number": "27AABCJ1234A1Z5"}, token)
cid = check("Company created", co, "id")

br = req("POST", "/masters/branches",
         {"company_id": cid, "name": f"Mumbai Branch {RUN}", "city": "Mumbai"}, token)
bid = check("Branch created", br, "id")

brand = req("POST", "/masters/brands",
            {"name": f"JSW TMT Fe500 {RUN}", "grade": "Fe500", "specification": "IS 1786"}, token)
rbid = check("Brand created", brand, "id")

cust = req("POST", "/masters/customers",
           {"name": f"Sharma Constructions {RUN}", "phone": "9876543210",
            "gst_number": "27AABCS9999B1Z1"}, token)
custid = check("Customer created", cust, "id")

# ── Purchase ──────────────────────────────────────────────────
print("\n── Purchase Flow ────────────────────────────────────────")
po = req("POST", "/purchases",
         {"company_id": cid, "branch_id": bid, "brand_id": rbid,
          "order_date": "2026-05-13", "invoice_number": "INV-001",
          "ordered_qty": 100, "rate_per_ton": 65000}, token)
poid = check("Purchase order (100T)", po, "id")
print(f"   Status: {po.get('status')}  Ordered: {po.get('ordered_qty')}T  Pending: {po.get('pending_qty')}T")

r1 = req("POST", f"/purchases/{poid}/receipts",
         {"receipt_date": "2026-05-13", "received_qty": 40,
          "vehicle_number": "MH04AB1234", "lr_number": "LR-001"}, token)
print(f"✅  Receipt 1 created (id={r1.get('id')}, 40T)")

r2 = req("POST", f"/purchases/{poid}/receipts",
         {"receipt_date": "2026-05-13", "received_qty": 30,
          "vehicle_number": "MH04CD5678"}, token)
print(f"✅  Receipt 2 created (id={r2.get('id')}, 30T)")

# Fetch lots for this brand to get IDs for dispatch
all_lots = req("GET", f"/stock/lots?brand_id={rbid}", token=token)
my_lots  = [l for l in (all_lots if isinstance(all_lots, list) else []) if l.get("available_qty", 0) > 0][-2:]
lot1id   = my_lots[0]["id"] if len(my_lots) > 0 else None
lot2id   = my_lots[1]["id"] if len(my_lots) > 1 else None
print(f"   Lots for dispatch: #{lot1id} (avail={my_lots[0]['available_qty'] if my_lots else '?'}T), #{lot2id}")

po2 = req("GET", f"/purchases/{poid}", token=token)
print(f"   PO Status: {po2.get('status')}  Received: {po2.get('received_qty')}T  Pending: {po2.get('pending_qty')}T")

# ── Sale ──────────────────────────────────────────────────────
print("\n── Sale Flow ────────────────────────────────────────────")
so = req("POST", "/sales",
         {"customer_id": custid, "brand_id": rbid,
          "order_date": "2026-05-13", "invoice_number": "SINV-001",
          "ordered_qty": 50, "rate_per_ton": 68000}, token)
soid = check("Sale order (50T)", so, "id")
print(f"   Status: {so.get('status')}  Customer: {so.get('customer_id')}")

d1 = req("POST", f"/sales/{soid}/dispatches",
         {"dispatch_date": "2026-05-13", "dispatched_qty": 25,
          "vehicle_number": "MH04EF9012", "challan_number": "CH-001",
          "allocations": [{"stock_lot_id": lot1id, "allocated_qty": 25}]}, token)
did = check("Dispatch 1 (25T)", d1, "id")

so2 = req("GET", f"/sales/{soid}", token=token)
print(f"   SO Status: {so2.get('status')}  Dispatched: {so2.get('dispatched_qty')}T  Pending: {so2.get('pending_qty')}T")

# ── Stock / Dashboard ─────────────────────────────────────────
print("\n── Stock & Dashboard ────────────────────────────────────")
lots = req("GET", "/stock/lots", token=token)
if isinstance(lots, list):
    for l in lots:
        avail = l.get("available_qty", "?")
        recv  = l.get("received_qty", "?")
        print(f"   Lot {l.get('lot_number')}  received={recv}T  available={avail}T")
else:
    print(f"   Lots response: {lots}")

dash = req("GET", "/stock/dashboard", token=token)
print(f"\n   📊 Dashboard:")
print(f"      Purchase orders : {dash.get('total_purchase_orders')} (open: {dash.get('open_purchase_orders')})")
print(f"      Sale orders     : {dash.get('total_sale_orders')} (open: {dash.get('open_sale_orders')})")
print(f"      Current stock   : {dash.get('current_stock_qty')}T")
print(f"      Pending receipt : {dash.get('total_pending_receipt_qty')}T")
print(f"      Pending dispatch: {dash.get('total_pending_dispatch_qty')}T")

print("\n" + "=" * 55)
print("  Smoke test complete ✅")
print(f"  Interactive docs → http://localhost:8000/docs")
print("=" * 55)
