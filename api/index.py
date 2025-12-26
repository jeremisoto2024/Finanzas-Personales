from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTION_TOKEN = os.environ.get('NOTION_TOKEN', '')
NOTION_INCOME_DB = os.environ.get('NOTION_INCOME_DB', '')
NOTION_EXPENSES_DB = os.environ.get('NOTION_EXPENSES_DB', '')
NOTION_API_URL = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

def get_notion_headers():
    return {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    }

def extract_property_value(prop_data):
    if not prop_data:
        return None
    prop_type = prop_data.get('type')
    if prop_type == 'number':
        return prop_data.get('number', 0)
    elif prop_type == 'select':
        return prop_data.get('select', {}).get('name', '')
    return None

def query_notion_database(database_id: str):
    if not NOTION_TOKEN or not database_id:
        return []
    url = f"{NOTION_API_URL}/databases/{database_id}/query"
    headers = get_notion_headers()
    try:
        response = requests.post(url, headers=headers, json={})
        response.raise_for_status()
        return response.json().get('results', [])
    except:
        return []

@app.get("/api")
async def root():
    return {"message": "Dashboard Financiero API", "status": "online"}

@app.get("/api/financial-summary")
async def get_financial_summary():
    income_entries = query_notion_database(NOTION_INCOME_DB)
    expense_entries = query_notion_database(NOTION_EXPENSES_DB)
    
    total_income = sum(extract_property_value(p.get('properties', {}).get('Cantidad')) or 0 for p in income_entries)
    total_expenses = sum(extract_property_value(p.get('properties', {}).get('Cantidad')) or 0 for p in expense_entries)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "available_balance": total_income - total_expenses
    }

@app.get("/api/expenses-by-category")
async def get_expenses_by_category():
    expenses = query_notion_database(NOTION_EXPENSES_DB)
    category_totals = {}
    total = 0
    
    for page in expenses:
        props = page.get('properties', {})
        amount = extract_property_value(props.get('Cantidad')) or 0
        category = extract_property_value(props.get('Categoría')) or 'Sin categoría'
        category_totals[category] = category_totals.get(category, 0) + amount
        total += amount
    
    return [
        {
            "category": cat,
            "amount": amt,
            "percentage": round((amt/total*100) if total > 0 else 0, 2)
        }
        for cat, amt in category_totals.items()
    ]
