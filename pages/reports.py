# 📄 reports.py
import streamlit as st
import pandas as pd
from datetime import datetime
import sqlite3

# ✅ Helper: Get current logged-in user
def get_current_user():
    if "user" in st.session_state:
        return st.session_state["user"]
    else:
        st.warning("⚠️ Please log in to view your reports.")
        st.stop()

# ✅ Helper: Fetch data from SQLite
def fetch_data(query, params=()):
    conn = sqlite3.connect("goat_farm.db")
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

# ✅ Section 1: Breeding & Pregnancy Report
def breeding_report(user_id):
    st.subheader("🐐 Breeding & Pregnancy Report")

    pregnancies = fetch_data("""
        SELECT female_id, breeding_date, expected_due_date
        FROM breeding
        WHERE user_id = ?
    """, (user_id,))

    if pregnancies:
        df = pd.DataFrame(pregnancies, columns=["Female ID", "Breeding Date", "Expected Due Date"])
        df["Breeding Date"] = pd.to_datetime(df["Breeding Date"])
        df["Expected Due Date"] = pd.to_datetime(df["Expected Due Date"])
        df["Days Remaining"] = (df["Expected Due Date"] - datetime.now()).dt.days

        # 📅 Show only those due in the next 30 days
        df_due_soon = df[df["Days Remaining"] <= 30]
        if not df_due_soon.empty:
            st.success("Upcoming births (within 30 days):")
            st.dataframe(df_due_soon, use_container_width=True)

            # 🕒 Countdown
            for _, row in df_due_soon.iterrows():
                st.write(
                    f"• Female **{row['Female ID']}** is due in **{row['Days Remaining']} days** "
                    f"(Expected: {row['Expected Due Date'].date()})"
                )
        else:
            st.info("✅ No expected births in the next 30 days.")
    else:
        st.info("No breeding records found for this account.")

# ✅ Section 2: Inventory Report
def inventory_report(user_id):
    st.subheader("📊 Inventory Report")

    totals = fetch_data("""
        SELECT category, COUNT(*)
        FROM goats
        WHERE user_id = ?
        GROUP BY category
    """, (user_id,))

    if totals:
        df_inventory = pd.DataFrame(totals, columns=["Category", "Total"])
        st.dataframe(df_inventory, use_container_width=True)
    else:
        st.info("No goats in your inventory yet.")

# ✅ Section 3: Sales Report (placeholder if you want to track sales later)
def sales_report(user_id):
    st.subheader("💰 Sales Report")

    sales = fetch_data("""
        SELECT goat_id, sale_date, amount
        FROM sales
        WHERE user_id = ?
    """, (user_id,))

    if sales:
        df_sales = pd.DataFrame(sales, columns=["Goat ID", "Sale Date", "Amount"])
        df_sales["Sale Date"] = pd.to_datetime(df_sales["Sale Date"])
        st.dataframe(df_sales, use_container_width=True)
    else:
        st.info("No sales records found.")

# ✅ Section 4: Export Reports (future enhancement)
def export_reports():
    st.subheader("📤 Export Reports")
    st.caption("Export features (PDF / CSV / Excel) coming soon.")
    st.button("Export as PDF")
    st.button("Export as CSV")

# ✅ Main Page
def main():
    st.set_page_config(page_title="Reports", page_icon="📑", layout="wide")
    st.title("📑 Reports")
    st.write("Here you can view reports related to your farm operations.")

    # Get logged-in user
    user = get_current_user()
    user_id = user["id"]

    # Expandable sections
    with st.expander("🐐 Breeding & Pregnancy Report", expanded=True):
        breeding_report(user_id)

    with st.expander("📊 Inventory Report", expanded=False):
        inventory_report(user_id)

    with st.expander("💰 Sales Report", expanded=False):
        sales_report(user_id)

    with st.expander("📤 Export Reports", expanded=False):
        export_reports()

if __name__ == "__main__":
    main()
def main():
    st.set_page_config(page_title="Reports", page_icon="📑", layout="wide")
    st.title("📑 Reports")
    st.write("Here you can view reports related to your farm operations.")

    # Get logged-in user
    user = get_current_user()

    # ✅ Use 'uid' instead of 'id'
    user_id = user.get("uid")  # safer than user["uid"]

    if not user_id:
        st.error("❌ User ID not found in session. Please log in again.")
        st.stop()

    # Expandable sections
    with st.expander("🐐 Breeding & Pregnancy Report", expanded=True):
        breeding_report(user_id)

    with st.expander("📊 Inventory Report", expanded=False):
        inventory_report(user_id)

    with st.expander("💰 Sales Report", expanded=False):
        sales_report(user_id)

    with st.expander("📤 Export Reports", expanded=False):
        export_reports()
