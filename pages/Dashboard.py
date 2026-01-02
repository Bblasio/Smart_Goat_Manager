import streamlit as st
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# =============================================
# 1. CUSTOM CSS FOR MODERN STYLING
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
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    /* Global styles */
    .stApp {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    
    /* Custom title with gradient */
    .custom-title {
        background: linear-gradient(90deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    
    /* Card styling for metrics */
    .metric-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: var(--shadow);
        border-left: 4px solid var(--primary);
        transition: transform 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
    }
    
    /* Section headers */
    .section-header {
        color: var(--dark);
        font-weight: 700;
        font-size: 1.5rem;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--primary);
    }
    
    /* Stats badges */
    .stat-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0.25rem;
    }
    
    .stat-badge.primary {
        background: linear-gradient(135deg, var(--primary), #6366F1);
        color: white;
    }
    
    .stat-badge.success {
        background: linear-gradient(135deg, var(--secondary), #34D399);
        color: white;
    }
    
    .stat-badge.warning {
        background: linear-gradient(135deg, var(--accent), #FBBF24);
        color: white;
    }
    
    /* Loading spinner */
    .loader {
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--primary);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 2rem auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Custom button styling */
    .stButton > button {
        background: linear-gradient(90deg, var(--primary), #6366F1);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
    }
    
    /* Empty state styling */
    .empty-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 12px;
        box-shadow: var(--shadow);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .custom-title {
            font-size: 2rem;
        }
        .metric-card {
            padding: 1rem;
        }
    }
</style>
""", unsafe_allow_html=True)

# =============================================
# 2. AUTH GUARD
# =============================================
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("🔒 Please log in to access your dashboard.")
    st.stop()

# =============================================
# 3. GET USER & TOKEN
# =============================================
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# =============================================
# 4. IMPORT DB
# =============================================
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# =============================================
# 5. HELPER FUNCTIONS
# =============================================
def get_val(resp):
    return resp.val() if resp and resp.val() is not None else {}

def create_metric_card(label, value, delta=None, icon="🐐", color="primary"):
    """Create a beautifully styled metric card"""
    colors = {
        "primary": "#4F46E5",
        "success": "#10B981", 
        "warning": "#F59E0B",
        "info": "#3B82F6",
        "danger": "#EF4444"
    }
    
    card_html = f"""
    <div class="metric-card" style="border-left-color: {colors[color]};">
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem; margin-right: 0.5rem;">{icon}</span>
            <span style="font-size: 0.875rem; color: #6B7280; font-weight: 600;">{label}</span>
        </div>
        <div style="display: flex; align-items: baseline;">
            <span style="font-size: 2rem; font-weight: 800; color: {colors[color]};">{value}</span>
            {f'<span style="margin-left: 0.5rem; font-size: 0.875rem; color: #10B981; font-weight: 600;">{delta}</span>' if delta else ''}
        </div>
    </div>
    """
    return card_html

# =============================================
# 6. FETCH DATA WITH LOADING STATE
# =============================================
st.markdown('<div class="loader"></div>', unsafe_allow_html=True)

with st.spinner("🔄 Loading your farm data..."):
    farm_resp = db.child("users").child(uid).get(token=id_token)
    farm_data = get_val(farm_resp)
    farm_name = farm_data.get("farm_name", "My Farm")
    created_at = farm_data.get("created_at")

    goats = get_val(db.child("users").child(uid).child("records").child("goats").get(token=id_token))
    breeding = get_val(db.child("users").child(uid).child("records").child("breeding").get(token=id_token))
    workers = get_val(db.child("users").child(uid).child("records").child("user_profile").get(token=id_token))

# Clear loading spinner
st.markdown("<script>document.querySelector('.loader').remove();</script>", unsafe_allow_html=True)

# =============================================
# 7. PAGE CONFIG
# =============================================
st.set_page_config(
    page_title=f"{farm_name} – Dashboard",
    page_icon="🐐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# =============================================
# 8. HERO HEADER
# =============================================
col1, col2 = st.columns([3, 1])
with col1:
    st.markdown(f'<h1 class="custom-title">🐐 {farm_name}</h1>', unsafe_allow_html=True)
with col2:
    # Refresh button
    if st.button("🔄 Refresh", use_container_width=True):
        st.rerun()

# Farm age badge
if created_at:
    try:
        created_date = datetime.fromisoformat(created_at.split("T")[0])
        days_active = (datetime.now() - created_date).days
        st.markdown(f'<span class="stat-badge primary">Active for {days_active} days</span>', unsafe_allow_html=True)
    except:
        pass

st.markdown("---")

# =============================================
# 9. CALCULATE METRICS
# =============================================
total_goats = len(goats)
males = sum(1 for g in goats.values() if str(g.get("gender") or "").lower().startswith("m"))
females = total_goats - males
pregnant_count = len(breeding)
total_workers = len(workers)

# Additional metrics
try:
    avg_age = np.mean([g.get("age_months", 0) for g in goats.values() if g.get("age_months")]) if goats else 0
    health_counts = {}
    for g in goats.values():
        status = g.get("health_status", "Healthy")
        health_counts[status] = health_counts.get(status, 0) + 1
    healthy_count = health_counts.get("Healthy", 0)
except:
    avg_age = 0
    healthy_count = total_goats

# =============================================
# 10. KPI DASHBOARD
# =============================================
st.markdown('<div class="section-header">📊 Farm Overview</div>', unsafe_allow_html=True)

# First row of metrics
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(create_metric_card("Total Goats", total_goats, icon="🐐", color="primary"), unsafe_allow_html=True)
with col2:
    st.markdown(create_metric_card("Male Goats", males, icon="♂️", color="info"), unsafe_allow_html=True)
with col3:
    st.markdown(create_metric_card("Female Goats", females, icon="♀️", color="danger"), unsafe_allow_html=True)
with col4:
    st.markdown(create_metric_card("Pregnant", pregnant_count, icon="🤰", color="success"), unsafe_allow_html=True)

# Second row of metrics
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(create_metric_card("Workers", total_workers, icon="👥", color="warning"), unsafe_allow_html=True)
with col2:
    st.markdown(create_metric_card("Healthy", healthy_count, icon="💚", color="success"), unsafe_allow_html=True)
with col3:
    pregnancy_rate = (pregnant_count / females * 100) if females > 0 else 0
    st.markdown(create_metric_card("Pregnancy Rate", f"{pregnancy_rate:.1f}%", icon="📈", color="success"), unsafe_allow_html=True)
with col4:
    avg_age_str = f"{avg_age:.1f}" if avg_age > 0 else "N/A"
    st.markdown(create_metric_card("Avg Age", f"{avg_age_str} mo", icon="📅", color="info"), unsafe_allow_html=True)

# =============================================
# 11. VISUALIZATIONS SECTION
# =============================================
st.markdown('<div class="section-header">📈 Farm Insights</div>', unsafe_allow_html=True)

viz_col1, viz_col2 = st.columns(2)

with viz_col1:
    # Gender Distribution Chart
    if total_goats > 0:
        gender_data = pd.DataFrame({
            "Gender": ["Male", "Female"],
            "Count": [males, females],
            "Color": ["#3B82F6", "#EC4899"]
        })
        
        fig_gender = go.Figure(data=[go.Pie(
            labels=gender_data["Gender"],
            values=gender_data["Count"],
            hole=.4,
            marker_colors=gender_data["Color"],
            textinfo='label+percent',
            insidetextorientation='radial',
            hoverinfo='label+value+percent',
            textfont=dict(size=14),
            marker=dict(line=dict(color='white', width=2))
        )])
        
        fig_gender.update_layout(
            title={
                'text': "🐐 Gender Distribution",
                'y':0.95,
                'x':0.5,
                'xanchor': 'center',
                'yanchor': 'top',
                'font': dict(size=20, color='#1F2937')
            },
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            height=400
        )
        
        st.plotly_chart(fig_gender, use_container_width=True)
    else:
        st.markdown("""
        <div class="empty-state">
            <span style="font-size: 3rem;">🐐</span>
            <h3>No goats recorded yet</h3>
            <p>Add your first goat to see visualizations</p>
        </div>
        """, unsafe_allow_html=True)

with viz_col2:
    # Breeding Activity Chart
    if breeding:
        df_breed = pd.DataFrame(list(breeding.values()))
        if "mating_date" in df_breed.columns:
            df_breed["mating_date"] = pd.to_datetime(df_breed["mating_date"], errors="coerce")
            df_breed = df_breed.dropna(subset=["mating_date"])
            
            # Create monthly trend
            df_breed["Month"] = df_breed["mating_date"].dt.strftime("%b '%y")
            monthly_counts = df_breed.groupby("Month").size().reset_index(name="Count")
            monthly_counts = monthly_counts.sort_values("Month")
            
            fig_trend = go.Figure(data=[go.Bar(
                x=monthly_counts["Month"],
                y=monthly_counts["Count"],
                marker_color='#10B981',
                marker_line_color='white',
                marker_line_width=2,
                opacity=0.8,
                hovertemplate='%{x}<br>Count: %{y}<extra></extra>'
            )])
            
            fig_trend.update_layout(
                title={
                    'text': "📅 Breeding Activity",
                    'y':0.95,
                    'x':0.5,
                    'xanchor': 'center',
                    'yanchor': 'top',
                    'font': dict(size=20, color='#1F2937')
                },
                xaxis_title="Month",
                yaxis_title="Number of Breedings",
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                height=400,
                hovermode='x unified'
            )
            
            st.plotly_chart(fig_trend, use_container_width=True)
    else:
        st.markdown("""
        <div class="empty-state">
            <span style="font-size: 3rem;">🤰</span>
            <h3>No breeding records</h3>
            <p>Start tracking breeding activities</p>
        </div>
        """, unsafe_allow_html=True)

# =============================================
# 12. QUICK STATS & ACTIONS
# =============================================
st.markdown('<div class="section-header">⚡ Quick Stats & Actions</div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    # Health Status Distribution
    if total_goats > 0:
        st.markdown("#### 🏥 Health Status")
        health_data = []
        for status, count in health_counts.items():
            if count > 0:
                percentage = (count / total_goats) * 100
                health_data.append(f"""
                <div style="margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="font-weight: 600;">{status}</span>
                        <span>{count} ({percentage:.1f}%)</span>
                    </div>
                    <div style="height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden;">
                        <div style="width: {percentage}%; height: 100%; background: linear-gradient(90deg, #10B981, #34D399);"></div>
                    </div>
                </div>
                """)
        st.markdown("".join(health_data), unsafe_allow_html=True)

with col2:
    # Quick Actions
    st.markdown("#### 🚀 Quick Actions")
    action_cols = st.columns(2)
    
    with action_cols[0]:
        if st.button("➕ Add Goat", use_container_width=True, type="primary"):
            st.session_state.page = "add_goat"
            st.rerun()
        
        if st.button("📊 View Reports", use_container_width=True):
            st.session_state.page = "reports"
            st.rerun()
    
    with action_cols[1]:
        if st.button("🤰 Record Breeding", use_container_width=True):
            st.session_state.page = "breeding"
            st.rerun()
        
        if st.button("👥 Manage Team", use_container_width=True):
            st.session_state.page = "workers"
            st.rerun()

# =============================================
# 13. RECENT ACTIVITY (Optional - if you have activity logs)
# =============================================
st.markdown('<div class="section-header">📝 Recent Activity</div>', unsafe_allow_html=True)

# This section can be populated with actual activity data from your database
activity_data = [
    {"icon": "➕", "action": "New goat added", "details": "Goat ID: G-001", "time": "2 hours ago"},
    {"icon": "🤰", "action": "Breeding recorded", "details": "For Doe: D-003", "time": "1 day ago"},
    {"icon": "💉", "action": "Vaccination updated", "details": "5 goats vaccinated", "time": "2 days ago"},
    {"icon": "👥", "action": "Worker assigned", "details": "John → Feeding duty", "time": "3 days ago"},
]

for activity in activity_data:
    st.markdown(f"""
    <div style="background: white; padding: 1rem; margin-bottom: 0.5rem; border-radius: 8px; border-left: 3px solid var(--primary);">
        <div style="display: flex; align-items: center;">
            <span style="font-size: 1.25rem; margin-right: 1rem;">{activity['icon']}</span>
            <div style="flex-grow: 1;">
                <div style="font-weight: 600; color: var(--dark);">{activity['action']}</div>
                <div style="font-size: 0.875rem; color: #6B7280;">{activity['details']}</div>
            </div>
            <span style="font-size: 0.75rem; color: #9CA3AF;">{activity['time']}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# =============================================
# 14. FOOTER
# =============================================
st.markdown("---")
footer_cols = st.columns(3)
with footer_cols[1]:
    st.markdown("""
    <div style="text-align: center; color: #6B7280; font-size: 0.875rem; padding: 1rem;">
        <div>🐐 <strong>Smart Goat Management System</strong></div>
        <div>Last updated: """ + datetime.now().strftime("%Y-%m-%d %H:%M") + """</div>
    </div>
    """, unsafe_allow_html=True)