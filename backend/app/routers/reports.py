"""Reports router for generating and managing PDF reports."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, Literal
import logging

from ..auth.security import get_current_active_user
from ..database import get_db
from ..models.user import User
from ..models.payroll import PayrollRun, PayrollItem
from ..models.finance import Transaction
from ..utils.pdf_reports import pdf_service
from ..utils.s3_storage import s3_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/financial")
async def generate_financial_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    report_type: Literal["income", "expense", "summary"] = Query("summary", description="Type of financial report"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a financial report PDF and upload to S3.
    
    Args:
        start_date: Start date for the report period
        end_date: End date for the report period
        report_type: Type of report (income, expense, or summary)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Download URL and S3 file key
    """
    try:
        # Get company name from user's company
        company_name = current_user.company.name if current_user.company else "Company"
        
        # Aggregate revenue data
        revenues = db.query(Transaction).filter(
            Transaction.company_id == current_user.company_id,
            Transaction.type == "income",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()
        
        total_income = sum(r.amount for r in revenues)
        
        # Aggregate expense data
        expenses = db.query(Transaction).filter(
            Transaction.company_id == current_user.company_id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()
        
        total_expenses = sum(e.amount for e in expenses)
        
        # Create expense breakdown by category
        expense_breakdown = {}
        for expense in expenses:
            category = expense.category or "Uncategorized"
            expense_breakdown[category] = expense_breakdown.get(category, 0) + expense.amount
        
        # Prepare report data
        report_data = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "income": total_income,
            "expenses": total_expenses,
            "net": total_income - total_expenses,
            "expense_breakdown": expense_breakdown
        }
        
        # Determine report title
        report_titles = {
            "income": "Income Statement",
            "expense": "Expense Report",
            "summary": "Financial Summary"
        }
        report_title = report_titles.get(report_type, "Financial Report")
        
        # Generate PDF
        pdf_bytes = pdf_service.generate_financial_report(
            company_name=company_name,
            report_data=report_data,
            report_type=report_title
        )
        
        # Upload to S3
        filename = f"financial_report_{start_date}_{end_date}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        file_key = f"{current_user.company_id}/reports/{filename}"
        
        s3_service.upload_file(
            file_obj=pdf_bytes,
            file_key=file_key,
            content_type="application/pdf",
            metadata={
                "report_type": report_type,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "generated_by": str(current_user.id),
                "company_id": str(current_user.company_id)
            }
        )
        
        # Generate download URL (valid for 1 hour)
        download_url = s3_service.get_presigned_url(file_key, expiration=3600)
        
        logger.info(f"Generated financial report for company {current_user.company_id}: {file_key}")
        
        return {
            "message": "Financial report generated successfully",
            "file_key": file_key,
            "download_url": download_url,
            "filename": filename,
            "report_data": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_income": total_income - total_expenses,
                "period": f"{start_date} to {end_date}"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to generate financial report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.post("/payroll")
async def generate_payroll_report(
    start_date: date = Query(..., description="Start date for payroll period"),
    end_date: date = Query(..., description="End date for payroll period"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a payroll report PDF and upload to S3.
    
    Args:
        start_date: Start date for the payroll period
        end_date: End date for the payroll period
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Download URL and S3 file key
    """
    try:
        # Check authorization (admin or manager only)
        if current_user.role not in ["company_admin", "super_admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and managers can generate payroll reports"
            )
        
        # Get company name
        company_name = current_user.company.name if current_user.company else "Company"
        
        # Get payroll records (runs for the company in period)
        # Using PayrollItem since it has the detailed breakdown per employee
        payroll_items = db.query(PayrollItem).filter(
            PayrollItem.company_id == current_user.company_id,
            PayrollItem.created_at >= datetime.combine(start_date, datetime.min.time()),
            PayrollItem.created_at <= datetime.combine(end_date, datetime.max.time())
        ).all()
        
        if not payroll_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No payroll data found for the specified period"
            )
        
        # Prepare payroll data for PDF
        payroll_data = []
        for item in payroll_items:
            employee_name = f"{item.employee.first_name} {item.employee.last_name}" if item.employee else "Unknown"
            payroll_data.append({
                "employee_name": employee_name,
                "gross_pay": float(item.base_salary),
                "deductions": float(item.deductions),
                "net_pay": float(item.net_amount)
            })
        
        # Generate PDF
        pdf_bytes = pdf_service.generate_payroll_report(
            company_name=company_name,
            payroll_data=payroll_data,
            period_start=start_date.strftime("%Y-%m-%d"),
            period_end=end_date.strftime("%Y-%m-%d")
        )
        
        # Upload to S3
        filename = f"payroll_report_{start_date}_{end_date}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        file_key = f"{current_user.company_id}/reports/{filename}"
        
        s3_service.upload_file(
            file_obj=pdf_bytes,
            file_key=file_key,
            content_type="application/pdf",
            metadata={
                "report_type": "payroll",
                "start_date": str(start_date),
                "end_date": str(end_date),
                "generated_by": str(current_user.id),
                "company_id": str(current_user.company_id)
            }
        )
        
        # Generate download URL
        download_url = s3_service.get_presigned_url(file_key, expiration=3600)
        
        logger.info(f"Generated payroll report for company {current_user.company_id}: {file_key}")
        
        return {
            "message": "Payroll report generated successfully",
            "file_key": file_key,
            "download_url": download_url,
            "filename": filename,
            "report_data": {
                "employee_count": len(payroll_data),
                "total_gross": sum(p["gross_pay"] for p in payroll_data),
                "total_net": sum(p["net_pay"] for p in payroll_data),
                "period": f"{start_date} to {end_date}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate payroll report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/list")
async def list_reports(
    current_user: User = Depends(get_current_active_user)
):
    """List all generated reports for the company.
    
    Returns:
        List of report files with metadata
    """
    try:
        # List all files in the reports folder
        folder_prefix = f"{current_user.company_id}/reports/"
        files = s3_service.list_files(folder_prefix)
        
        # Sort by last modified (newest first)
        files.sort(key=lambda x: x.get("LastModified", ""), reverse=True)
        
        return {
            "reports": files,
            "count": len(files)
        }
        
    except Exception as e:
        logger.error(f"Failed to list reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list reports: {str(e)}"
        )


@router.get("/download/{file_key:path}")
async def download_report(
    file_key: str,
    current_user: User = Depends(get_current_active_user)
):
    """Generate a presigned download URL for a report.
    
    Args:
        file_key: S3 file key
        current_user: Current authenticated user
        
    Returns:
        Presigned download URL
    """
    try:
        # Verify file belongs to user's company
        if not file_key.startswith(f"{current_user.company_id}/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: File belongs to another company"
            )
        
        # Check if file exists
        metadata = s3_service.get_file_metadata(file_key)
        if not metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Generate presigned URL (valid for 1 hour)
        download_url = s3_service.get_presigned_url(file_key, expiration=3600)
        
        return {
            "download_url": download_url,
            "file_key": file_key,
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate download URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )
