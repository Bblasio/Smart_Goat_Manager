# pages/Manage Records.py
import streamlit as st
import uuid
from datetime import datetime

# -------------------------------------------------
# 1. AUTH GUARD – only logged-in users
# -------------------------------------------------
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in first.")
    st.stop()

user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# -------------------------------------------------
# 2. IMPORT DB FROM app.py (shared firebase instance)
# -------------------------------------------------
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db          # <-- same db you use in login / dashboard

# -------------------------------------------------
# 3. HELPERS (user-scoped)
# -------------------------------------------------
def gen_id():
    return str(uuid.uuid4())

def add_record(collection: str, data: dict):
    """Add a record under the current user."""
    rid = gen_id()
    db.child("users").child(uid).child("records").child(collection).child(rid).set(
        data, token=id_token
    )
    st.success(f"{collection.title()} added!")

def delete_record(collection: str, rid: str, name: str = "record"):
    """Delete a record under the current user."""
    try:
        db.child("users").child(uid).child("records").child(collection).child(rid).remove(
            token=id_token
        )
        st.success(f"{name} deleted!")
        st.rerun()
    except Exception as e:
        st.error(f"Delete error: {e}")

def get_records(collection: str) -> dict:
    """Return dict of records (empty dict if none)."""
    resp = db.child("users").child(uid).child("records").child(collection).get(token=id_token)
    return resp.val() if resp and resp.val() else {}

# -------------------------------------------------
# 4. PAGE UI
# -------------------------------------------------
st.set_page_config(page_title="Farm Records", layout="wide")
st.title("Farm Records Management")

tabs = st.tabs(["Goats", "Breeding", "Health", "Sales", "User Profile"])

# -------------------------------------------------
# 5. DISPLAY + DELETE (one tab per collection)
# -------------------------------------------------
def show_tab(collection: str, fields: list, name_key: str):
    """Generic tab that lists records and offers delete."""
    records = get_records(collection)
    if records:
        for rid, rec in records.items():
            cols = st.columns(len(fields) + 1)   # +1 for delete button
            for i, f in enumerate(fields):
                cols[i].write(rec.get(f, "—"))
            if cols[-1].button("Delete", key=f"del_{collection}_{rid}"):
                if st.button(f"Confirm delete {rec.get(name_key, rid)}?", key=f"conf_{rid}"):
                    delete_record(collection, rid, rec.get(name_key, rid))
    else:
        st.info(f"No {collection} found.")

with tabs[0]:   # Goats
    st.subheader("All Goats")
    show_tab("goats", ["tag_number", "breed", "gender", "dob"], "tag_number")

with tabs[1]:   # Breeding
    st.subheader("All Breeding Records")
    show_tab("breeding", ["female_id", "male_id", "mating_date", "expected_birth"], "female_id")

with tabs[2]:   # Health
    st.subheader("All Health Records")
    show_tab("health", ["goat_id", "condition", "treatment", "checkup_date"], "goat_id")

with tabs[3]:   # Sales
    st.subheader("All Sales Records")
    show_tab("sales", ["goat_id", "buyer_name", "price", "sale_date"], "goat_id")

with tabs[4]:   # User Profile (optional – you already have auth data)
    st.subheader("User Profile")
    show_tab("user_profile", ["full_name", "phone", "location"], "full_name")

# -------------------------------------------------
# 6. FLOATING “+” BUTTON (just a visual cue)
# -------------------------------------------------
st.markdown(
    """
    <style>
    .floating-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background:#fff;
        color:#000;
        border:none;
        border-radius:50%;
        width:60px;height:60px;
        font-size:30px;
        box-shadow:0 4px 10px rgba(0,0,0,.3);
        cursor:pointer;
    }
    .floating-btn:hover{background:#f0f0f0}
    </style>
    <button class="floating-btn" onclick="document.getElementById('add-section').scrollIntoView()">+</button>
    """,
    unsafe_allow_html=True,
)

# -------------------------------------------------
# 7. SIDEBAR – ADD NEW RECORD
# -------------------------------------------------
with st.sidebar:
    st.subheader("Add New Record")
    rec_type = st.selectbox(
        "Type", ["", "Goat", "Breeding", "Health", "Sales", "User Profile"]
    )

    # ---------- GOAT ----------
    if rec_type == "Goat":
        with st.form("add_goat", clear_on_submit=True):
            tag = st.text_input("Tag Number *")
            breed = st.text_input("Breed *")
            gender = st.selectbox("Gender", ["Male", "Female"])
            dob = st.date_input("Date of Birth")
            submitted = st.form_submit_button("Save Goat")
            if submitted and tag and breed:
                add_record("goats", {
                    "tag_number": tag,
                    "breed": breed,
                    "gender": gender,
                    "dob": str(dob),
                    "created_at": datetime.now().isoformat(),
                })
            elif submitted:
                st.error("Tag & Breed required")

    # ---------- BREEDING ----------
    elif rec_type == "Breeding":
        with st.form("add_breeding", clear_on_submit=True):
            female = st.text_input("Female Tag *")
            male = st.text_input("Male Tag *")
            mating = st.date_input("Mating Date")
            expected = st.date_input("Expected Birth")
            submitted = st.form_submit_button("Save Breeding")
            if submitted and female and male:
                add_record("breeding", {
                    "female_id": female,
                    "male_id": male,
                    "mating_date": str(mating),
                    "expected_birth": str(expected),
                    "created_at": datetime.now().isoformat(),
                })
            elif submitted:
                st.error("Both tags required")

    # ---------- HEALTH ----------
    elif rec_type == "Health":
        with st.form("add_health", clear_on_submit=True):
            goat = st.text_input("Goat Tag *")
            cond = st.text_input("Condition")
            treat = st.text_input("Treatment")
            chk = st.date_input("Check-up Date")
            submitted = st.form_submit_button("Save Health")
            if submitted and goat:
                add_record("health", {
                    "goat_id": goat,
                    "condition": cond,
                    "treatment": treat,
                    "checkup_date": str(chk),
                    "created_at": datetime.now().isoformat(),
                })
            elif submitted:
                st.error("Goat tag required")

    # ---------- SALES ----------
    elif rec_type == "Sales":
        with st.form("add_sale", clear_on_submit=True):
            goat = st.text_input("Goat Tag *")
            buyer = st.text_input("Buyer Name")
            price = st.number_input("Price (Ksh)", min_value=0.0)
            sdate = st.date_input("Sale Date")
            submitted = st.form_submit_button("Save Sale")
            if submitted and goat:
                add_record("sales", {
                    "goat_id": goat,
                    "buyer_name": buyer,
                    "price": price,
                    "sale_date": str(sdate),
                    "created_at": datetime.now().isoformat(),
                })
            elif submitted:
                st.error("Goat tag required")

    # ---------- USER PROFILE ----------
    elif rec_type == "User Profile":
        with st.form("add_profile", clear_on_submit=True):
            name = st.text_input("Full Name")
            phone = st.text_input("Phone")
            loc = st.text_input("Location")
            submitted = st.form_submit_button("Save Profile")
            if submitted and name:
                add_record("user_profile", {
                    "full_name": name,
                    "phone": phone,
                    "location": loc,
                    "created_at": datetime.now().isoformat(),
                })
            elif submitted:
                st.error("Name required")