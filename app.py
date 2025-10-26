# app.py
import streamlit as st
from streamlit_option_menu import option_menu
import pyrebase
import json

# -------------------------------------------------
# 1. Load Firebase config from Streamlit Secrets
# -------------------------------------------------
if "firebase_config" not in st.secrets:
    st.error("Missing `firebase_config` in Streamlit Secrets!")
    st.stop()

firebaseConfig = json.loads(st.secrets["firebase_config"])

# -------------------------------------------------
# 2. Initialise Pyrebase
# -------------------------------------------------
firebase = pyrebase.initialize_app(firebaseConfig)
auth = firebase.auth()
db = firebase.database()

# -------------------------------------------------
# 3. Page config
# -------------------------------------------------
st.set_page_config(page_title="Smart Goat Farm", page_icon="goat", layout="wide")

# -------------------------------------------------
# 4. Session state defaults
# -------------------------------------------------
defaults = {
    "authenticated": False,
    "show_signup": False,
    "show_reset": False,
    "farm_name": "",
    "selected_page": "Dashboard",
    "user": None,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# -------------------------------------------------
# 5. Helper: parse Pyrebase errors
# -------------------------------------------------
def parse_pyrebase_error(e):
    msg = str(e).lower()
    if "email" in msg and "already" in msg: return "Email already in use."
    if "network" in msg or "timeout" in msg: return "Network error – try again."
    if "permission" in msg or "denied" in msg: return "Database permission denied."
    if "invalid" in msg and "password" in msg: return "Password too weak (min 6 chars)."
    return f"Error: {e}"

# -------------------------------------------------
# 6. Pages
# -------------------------------------------------
def forgot_password_page():
    st.title("Reset Password")
    with st.form("reset_form"):
        email = st.text_input("Email")
        if st.form_submit_button("Send Reset Link"):
            try:
                auth.send_password_reset_email(email)
                st.success("Reset link sent.")
                st.session_state.show_reset = False
                st.rerun()
            except Exception as e:
                st.error(parse_pyrebase_error(e))
    if st.button("Back"): st.session_state.show_reset = False; st.rerun()

def login_page():
    st.title("Login")
    with st.form("login_form"):
        email = st.text_input("Email")
        pwd = st.text_input("Password", type="password")
        if st.form_submit_button("Login"):
            try:
                user = auth.sign_in_with_email_and_password(email, pwd)
                uid = user["localId"]
                id_token = user["idToken"]
                farm = db.child("users").child(uid).child("farm_name").get(token=id_token).val()

                # Update session
                st.session_state.update({
                    "authenticated": True,
                    "user": user,
                    "farm_name": farm or "My Farm",
                    "selected_page": "Dashboard",
                })

                st.success("Welcome! Redirecting to Dashboard...")
                st.rerun()  # Forces immediate redirect

            except Exception as e:
                st.error(parse_pyrebase_error(e))

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Create Account"): st.session_state.show_signup = True; st.rerun()
    with c2:
        if st.button("Forgot Password"): st.session_state.show_reset = True; st.rerun()

def signup_page():
    st.title("Create Account")
    with st.form("signup_form"):
        farm_name = st.text_input("Farm Name")
        email = st.text_input("Email")
        pwd = st.text_input("Password", type="password")
        if st.form_submit_button("Sign Up"):
            if not farm_name.strip():
                st.error("Farm name required.")
            else:
                try:
                    user = auth.create_user_with_email_and_password(email, pwd)
                    uid = user["localId"]
                    id_token = user["idToken"]
                    db.child("users").child(uid).child("farm_name").set(farm_name, token=id_token)
                    st.success("Account created! Please log in.")
                    st.session_state.show_signup = False
                    st.rerun()
                except Exception as e:
                    st.error(parse_pyrebase_error(e))
    if st.button("Back"): st.session_state.show_signup = False; st.rerun()

# -------------------------------------------------
# 7. Routing
# -------------------------------------------------
if st.session_state.show_signup:
    signup_page()
elif st.session_state.show_reset:
    forgot_password_page()
elif not st.session_state.authenticated:
    login_page()
else:
    # === USER IS LOGGED IN → GO TO PAGES FOLDER ===
    import os
    page_path = f"pages/{st.session_state.selected_page}.py"
    
    if os.path.exists(page_path):
        with open(page_path) as f:
            exec(f.read(), globals())
    else:
        st.error(f"Page '{st.session_state.selected_page}' not found.")
        st.write("Available: Dashboard, Manage Goats, Breeding")

    # Sidebar (only after login)
    with st.sidebar:
        st.markdown(f"### {st.session_state.farm_name}")
        if st.button("Logout"):
            for k in ["authenticated", "user", "farm_name"]:
                st.session_state[k] = None if k != "authenticated" else False
            st.session_state.selected_page = "Dashboard"
            st.rerun()

        st.session_state.selected_page = option_menu(
            "Navigation",
            ["Dashboard", "Manage Goats", "Breeding"],
            icons=["speedometer", "clipboard-data", "heart"],
            default_index=["Dashboard", "Manage Goats", "Breeding"]
            .index(st.session_state.selected_page),
        )