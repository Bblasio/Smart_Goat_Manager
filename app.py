import streamlit as st
import pyrebase
import json
from datetime import datetime

# =============================================
# 1. CUSTOM CSS FOR MODERN LOGIN INTERFACE
# =============================================
st.markdown("""
<style>
    /* Main theme colors */
    :root {
        --primary: #4F46E5;
        --secondary: #10B981;
        --accent: #F59E0B;
        --dark: #1F2937;
        --light: #F9FAFB;
        --card-bg: #FFFFFF;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
        --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
        --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
        --gradient-warning: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
    }
    
    /* Background with subtle pattern */
    .stApp {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        background-image: 
            radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.03) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 20%);
    }
    
    /* Login container */
    .login-container {
        max-width: 450px;
        margin: 4rem auto;
        background: white;
        border-radius: 24px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        border: 1px solid rgba(229, 231, 235, 0.5);
        position: relative;
    }
    
    .login-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, var(--primary), var(--secondary));
    }
    
    /* Header styling */
    .login-header {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        padding: 3rem 2rem 2rem;
        text-align: center;
        border-bottom: 1px solid #E5E7EB;
    }
    
    .login-title {
        background: linear-gradient(90deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }
    
    .login-subtitle {
        color: #6B7280;
        font-size: 1rem;
        font-weight: 500;
    }
    
    /* Goat icon animation */
    .goat-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: float 3s ease-in-out infinite;
        display: inline-block;
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    
    /* Form styling */
    .login-form {
        padding: 2rem;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-label {
        display: block;
        color: var(--dark);
        font-weight: 600;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .stTextInput > div > div > input,
    .stTextInput > div > div > input:focus {
        border: 2px solid #E5E7EB;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: #F9FAFB;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        background: white;
    }
    
    /* Button styling */
    .stButton > button {
        background: linear-gradient(90deg, var(--primary), #6366F1);
        color: white;
        border: none;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        width: 100%;
        transition: all 0.3s ease;
        margin-top: 0.5rem;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
    }
    
    .secondary-btn {
        background: linear-gradient(90deg, var(--secondary), #34D399) !important;
    }
    
    .ghost-btn {
        background: transparent !important;
        color: var(--dark) !important;
        border: 2px solid #E5E7EB !important;
    }
    
    .ghost-btn:hover {
        border-color: var(--primary) !important;
        background: rgba(79, 70, 229, 0.05) !important;
    }
    
    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0;
        background-color: #F3F4F6;
        padding: 0.5rem;
        border-radius: 12px;
        margin: 1.5rem 0;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 45px;
        white-space: pre-wrap;
        background-color: transparent;
        border-radius: 8px;
        color: #6B7280;
        font-weight: 500;
        padding: 0 1.5rem;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: white !important;
        color: var(--primary) !important;
        font-weight: 600;
        box-shadow: var(--shadow-sm);
    }
    
    /* Success/Error messages */
    .stAlert {
        border-radius: 12px;
        padding: 1rem 1.25rem;
        border: none;
        margin: 1rem 0;
    }
    
    [data-testid="stAlertSuccess"] {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1));
        border-left: 4px solid var(--secondary);
        color: #065F46;
    }
    
    [data-testid="stAlertError"] {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1));
        border-left: 4px solid #EF4444;
        color: #991B1B;
    }
    
    /* Footer */
    .login-footer {
        padding: 1.5rem 2rem;
        text-align: center;
        border-top: 1px solid #E5E7EB;
        background: #F9FAFB;
        color: #6B7280;
        font-size: 0.875rem;
    }
    
    .login-footer a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 600;
    }
    
    /* Feature cards */
    .feature-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
        border: 1px solid #E5E7EB;
        text-align: center;
        transition: all 0.3s ease;
        height: 100%;
    }
    
    .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
    }
    
    .feature-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
        display: inline-block;
        padding: 1rem;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1));
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .login-container {
            margin: 1rem;
            max-width: 100%;
        }
        .login-title {
            font-size: 2rem;
        }
    }
</style>
""", unsafe_allow_html=True)

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
st.set_page_config(
    page_title="Smart Goat Farm",
    page_icon="🐐",
    layout="wide",
    initial_sidebar_state="collapsed"
)

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
# 5. Helper: Parse Firebase Auth Errors
# -------------------------------------------------
def parse_auth_error(e):
    error_msg = str(e).lower()
    if "invalid" in error_msg and "password" in error_msg:
        return "Wrong password. Please try again."
    if "user" in error_msg and "not found" in error_msg:
        return "Email not found. Please check or create an account."
    if "email" in error_msg and "already" in error_msg:
        return "Email already in use. Please try logging in instead."
    if "weak" in error_msg or "least 6" in error_msg:
        return "Password too weak. Must be at least 6 characters."
    if "network" in error_msg or "timeout" in error_msg:
        return "Network error. Please check your connection and try again."
    if "too many" in error_msg:
        return "Too many attempts. Please try again later."
    return "Authentication failed. Please check your credentials."

# -------------------------------------------------
# 6. Forgot Password Page
# -------------------------------------------------
def forgot_password_page():
    st.markdown('<div class="login-container">', unsafe_allow_html=True)
    
    # Header
    st.markdown("""
    <div class="login-header">
        <div class="goat-icon">🔐</div>
        <h1 class="login-title">Reset Password</h1>
        <p class="login-subtitle">Enter your email to receive a reset link</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Form
    with st.form("reset_form"):
        st.markdown('<div class="login-form">', unsafe_allow_html=True)
        
        email = st.text_input(
            "Email Address",
            placeholder="farmer@example.com",
            help="Enter the email associated with your account"
        )
        
        col1, col2 = st.columns([1, 2])
        with col1:
            if st.form_submit_button("← Back", use_container_width=True):
                st.session_state.show_reset = False
                st.rerun()
        
        with col2:
            if st.form_submit_button("📧 Send Reset Link", use_container_width=True, type="primary"):
                if not email.strip():
                    st.error("Please enter your email address.")
                else:
                    with st.spinner("Sending reset link..."):
                        try:
                            auth.send_password_reset_email(email)
                            st.success("✅ Reset link sent!")
                            st.info("Check your email inbox (including spam folder).")
                            st.session_state.show_reset = False
                            st.balloons()
                        except Exception as e:
                            st.error(parse_auth_error(e))
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
    <div class="login-footer">
        Remember your password? <a href="#" onclick="window.location.reload()">Back to Login</a>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# -------------------------------------------------
# 7. Login Page (Enhanced)
# -------------------------------------------------
def login_page():
    # Hero Section
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("""
        <div style="padding: 3rem 2rem; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="font-size: 3.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem;">
                <span style="color: #4F46E5;">Smart</span>
                <span style="color: #10B981;">Goat</span>
                <br>
                <span style="color: #1F2937;">Management</span>
            </h1>
            <p style="font-size: 1.25rem; color: #6B7280; margin-bottom: 3rem;">
                Professional goat farming management system for modern farmers.
                Track, manage, and grow your farm efficiently.
            </p>
            
            <div style="margin-top: 2rem;">
                <h3 style="color: #1F2937; margin-bottom: 1.5rem; font-size: 1.25rem;">✨ Key Features</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <div style="font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">Real-time Analytics</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">Monitor farm performance</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🤰</div>
                        <div style="font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">Breeding Tracking</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">Manage breeding cycles</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💉</div>
                        <div style="font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">Health Records</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">Track medical history</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📈</div>
                        <div style="font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">Growth Insights</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">Optimize farm operations</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #E5E7EB;">
                <div style="display: flex; align-items: center; gap: 1rem; color: #6B7280; font-size: 0.875rem;">
                    <span>🏆 Trusted by 500+ farms worldwide</span>
                    <span style="color: #E5E7EB;">•</span>
                    <span>⭐ 4.8/5 Average Rating</span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown('<div class="login-container" style="margin: 2rem auto;">', unsafe_allow_html=True)
        
        # Header
        st.markdown(f"""
        <div class="login-header">
            <div class="goat-icon">🐐</div>
            <h1 class="login-title">Welcome Back</h1>
            <p class="login-subtitle">Sign in to access your farm dashboard</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Create tabs for Login/Signup
        tab1, tab2 = st.tabs(["🔐 Login", "📝 Sign Up"])
        
        with tab1:
            with st.form("login_form"):
                st.markdown('<div class="login-form">', unsafe_allow_html=True)
                
                email = st.text_input(
                    "Email Address",
                    placeholder="farmer@example.com",
                    key="login_email"
                )
                
                pwd = st.text_input(
                    "Password",
                    type="password",
                    placeholder="••••••••",
                    key="login_password"
                )
                
                # Remember me checkbox
                col1, col2 = st.columns([1, 1])
                with col1:
                    remember_me = st.checkbox("Remember me", value=True)
                with col2:
                    st.markdown('<div style="text-align: right;">', unsafe_allow_html=True)
                    if st.button("Forgot Password?", key="forgot_login"):
                        st.session_state.show_reset = True
                        st.rerun()
                    st.markdown('</div>', unsafe_allow_html=True)
                
                # Login button
                if st.form_submit_button("🚀 Login to Dashboard", use_container_width=True, type="primary"):
                    if not email or not pwd:
                        st.error("Please fill in all fields.")
                    else:
                        with st.spinner("Authenticating..."):
                            try:
                                user = auth.sign_in_with_email_and_password(email, pwd)
                                uid = user["localId"]
                                id_token = user["idToken"]
                                farm = db.child("users").child(uid).child("farm_name").get(token=id_token).val()
                                
                                st.session_state.update({
                                    "authenticated": True,
                                    "user": user,
                                    "farm_name": farm or "My Farm",
                                    "selected_page": "Dashboard",
                                })
                                st.success("✅ Login successful!")
                                st.balloons()
                                st.rerun()
                            except Exception as e:
                                st.error(f"❌ {parse_auth_error(e)}")
                
                st.markdown('</div>', unsafe_allow_html=True)
        
        with tab2:
            with st.form("signup_form"):
                st.markdown('<div class="login-form">', unsafe_allow_html=True)
                
                farm_name = st.text_input(
                    "Farm Name",
                    placeholder="Sunny Valley Goat Farm",
                    key="signup_farm"
                )
                
                email = st.text_input(
                    "Email Address",
                    placeholder="farmer@example.com",
                    key="signup_email"
                )
                
                pwd = st.text_input(
                    "Password",
                    type="password",
                    placeholder="••••••••",
                    key="signup_password",
                    help="At least 6 characters"
                )
                
                # Password strength indicator
                if pwd:
                    strength = min(len(pwd) / 6, 1)
                    color = "#EF4444" if strength < 0.5 else "#F59E0B" if strength < 0.8 else "#10B981"
                    st.markdown(f"""
                    <div style="margin: 0.5rem 0 1.5rem 0;">
                        <div style="height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; width: {strength*100}%; background: {color}; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                            <span style="font-size: 0.75rem; color: #6B7280;">Password strength</span>
                            <span style="font-size: 0.75rem; color: {color}; font-weight: 600;">
                                {"Weak" if strength < 0.5 else "Medium" if strength < 0.8 else "Strong"}
                            </span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                
                # Terms agreement
                agree = st.checkbox("I agree to the Terms of Service and Privacy Policy", value=False)
                
                # Signup button
                if st.form_submit_button("🚜 Create Farm Account", use_container_width=True, type="primary"):
                    if not all([farm_name.strip(), email.strip(), pwd]):
                        st.error("All fields are required.")
                    elif len(pwd) < 6:
                        st.error("Password must be at least 6 characters.")
                    elif not agree:
                        st.error("Please agree to the terms and conditions.")
                    else:
                        with st.spinner("Creating your farm account..."):
                            try:
                                user = auth.create_user_with_email_and_password(email, pwd)
                                uid = user["localId"]
                                id_token = user["idToken"]
                                
                                # Create initial user data
                                user_data = {
                                    "farm_name": farm_name.strip(),
                                    "email": email,
                                    "created_at": datetime.now().isoformat(),
                                    "plan": "free",
                                    "records": {
                                        "goats": {},
                                        "breeding": {},
                                        "user_profile": {}
                                    }
                                }
                                
                                db.child("users").child(uid).set(user_data, token=id_token)
                                
                                st.session_state.update({
                                    "authenticated": True,
                                    "user": user,
                                    "farm_name": farm_name.strip(),
                                    "selected_page": "Dashboard",
                                })
                                st.success("🎉 Account created successfully!")
                                st.balloons()
                                st.rerun()
                            except Exception as e:
                                st.error(f"❌ {parse_auth_error(e)}")
                
                st.markdown('</div>', unsafe_allow_html=True)
        
        # Footer
        st.markdown(f"""
        <div class="login-footer">
            <div style="margin-bottom: 0.5rem;">© {datetime.now().year} Smart Goat System</div>
            <div style="font-size: 0.75rem; opacity: 0.7;">
                Secure authentication • Encrypted data • 24/7 Support
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)

# -------------------------------------------------
# 8. Signup Page (Redirects to login with tabs)
# -------------------------------------------------
def signup_page():
    # Redirect to login page with signup tab open
    st.session_state.show_signup = False
    st.rerun()

# -------------------------------------------------
# 9. Routing
# -------------------------------------------------
if st.session_state.show_reset:
    forgot_password_page()
elif not st.session_state.authenticated:
    login_page()
else:
    # === GO TO PAGES FOLDER ===
    import os
    page_path = f"pages/{st.session_state.selected_page}.py"
    if os.path.exists(page_path):
        with open(page_path) as f:
            exec(f.read(), globals())
    else:
        st.error(f"Page '{st.session_state.selected_page}' not found.")
    
    # === SIDEBAR: Modern Welcome + Logout ===
    with st.sidebar:
        st.markdown(f"""
        <div style="text-align: center; padding: 1.5rem 0;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🐐</div>
            <h3 style="color: var(--dark); margin-bottom: 0.25rem;">{st.session_state.farm_name}</h3>
            <div style="color: #6B7280; font-size: 0.875rem; margin-bottom: 1.5rem;">
                Smart Goat Management
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        if st.button("🚪 Logout", use_container_width=True, type="secondary"):
            for k in ["authenticated", "user", "farm_name"]:
                st.session_state[k] = None if k != "authenticated" else False
            st.session_state.selected_page = "Dashboard"
            st.success("Logged out successfully!")
            st.rerun()