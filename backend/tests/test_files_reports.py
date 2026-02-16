"""Tests for file upload and management endpoints."""

import pytest
import io
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


class TestFileUpload:
    """Test suite for file upload endpoints."""
    
    @patch("app.routers.files.s3_service")
    def test_upload_file_success(self, mock_s3, client, auth_headers, test_company):
        """Test successful file upload."""
        # Mock S3 upload
        mock_s3.upload_file.return_value = None
        mock_s3.get_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/test-file.pdf"
        
        # Create test file
        file_content = b"Test PDF content"
        files = {
            "file": ("test-document.pdf", io.BytesIO(file_content), "application/pdf")
        }
        data = {"folder": "invoices"}
        
        response = client.post(
            "/api/files/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "file_key" in result
        assert "file_url" in result
        assert test_company.id in result["file_key"]
    
    @patch("app.routers.files.s3_service")
    def test_upload_multiple_files_success(self, mock_s3, client, auth_headers):
        """Test successful multiple file upload."""
        mock_s3.upload_file.return_value = None
        mock_s3.get_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/test-file.pdf"
        
        # Create multiple test files
        files = [
            ("files", ("doc1.pdf", io.BytesIO(b"Content 1"), "application/pdf")),
            ("files", ("doc2.pdf", io.BytesIO(b"Content 2"), "application/pdf")),
        ]
        data = {"folder": "employee-docs"}
        
        response = client.post(
            "/api/files/upload/multiple",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        result = response.json()
        assert len(result["uploaded"]) == 2
        assert len(result["failed"]) == 0
    
    def test_upload_file_too_large(self, client, auth_headers):
        """Test upload of file exceeding size limit."""
        # Create file larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {
            "file": ("large-file.pdf", io.BytesIO(large_content), "application/pdf")
        }
        
        response = client.post(
            "/api/files/upload",
            headers=auth_headers,
            files=files
        )
        
        assert response.status_code == 400
        assert "size" in response.json()["detail"].lower()
    
    def test_upload_file_invalid_type(self, client, auth_headers):
        """Test upload of file with invalid type."""
        files = {
            "file": ("malicious.exe", io.BytesIO(b"exe content"), "application/x-msdownload")
        }
        
        response = client.post(
            "/api/files/upload",
            headers=auth_headers,
            files=files
        )
        
        assert response.status_code == 400
        assert "type" in response.json()["detail"].lower()
    
    @patch("app.routers.files.s3_service")
    def test_list_files(self, mock_s3, client, auth_headers, test_company):
        """Test listing files."""
        mock_s3.list_files.return_value = [
            {
                "Key": f"{test_company.id}/invoices/invoice1.pdf",
                "Size": 1024,
                "LastModified": "2024-01-01T00:00:00",
                "ContentType": "application/pdf"
            }
        ]
        
        response = client.get(
            "/api/files/list?folder=invoices",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "files" in result
        assert result["count"] == 1
    
    @patch("app.routers.files.s3_service")
    def test_download_file(self, mock_s3, client, auth_headers, test_company):
        """Test generating download URL."""
        file_key = f"{test_company.id}/invoices/test.pdf"
        mock_s3.get_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/presigned-url"
        
        response = client.get(
            f"/api/files/download/{file_key}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "download_url" in result
    
    def test_download_file_unauthorized_company(self, client, auth_headers):
        """Test download of file from another company fails."""
        file_key = "other-company-id/invoices/test.pdf"
        
        response = client.get(
            f"/api/files/download/{file_key}",
            headers=auth_headers
        )
        
        assert response.status_code == 403
    
    @patch("app.routers.files.s3_service")
    def test_delete_file_admin(self, mock_s3, client, auth_headers, test_company):
        """Test file deletion by admin."""
        file_key = f"{test_company.id}/invoices/test.pdf"
        mock_s3.delete_file.return_value = None
        
        response = client.delete(
            f"/api/files/delete/{file_key}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
    
    def test_delete_file_non_admin(self, client, employee_headers, test_company):
        """Test file deletion by non-admin fails."""
        file_key = f"{test_company.id}/invoices/test.pdf"
        
        response = client.delete(
            f"/api/files/delete/{file_key}",
            headers=employee_headers
        )
        
        assert response.status_code == 403


class TestReports:
    """Test suite for report generation endpoints."""
    
    @patch("app.routers.reports.pdf_service")
    @patch("app.routers.reports.s3_service")
    def test_generate_financial_report(self, mock_s3, mock_pdf, client, auth_headers, db_session):
        """Test financial report generation."""
        mock_pdf.generate_financial_report.return_value = b"PDF content"
        mock_s3.upload_file.return_value = None
        mock_s3.get_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/report.pdf"
        
        response = client.post(
            "/api/reports/financial?start_date=2024-01-01&end_date=2024-01-31&report_type=summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "download_url" in result
        assert "file_key" in result
        assert "report_data" in result
    
    @patch("app.routers.reports.pdf_service")
    @patch("app.routers.reports.s3_service")
    def test_generate_payroll_report_admin(self, mock_s3, mock_pdf, client, auth_headers):
        """Test payroll report generation by admin."""
        mock_pdf.generate_payroll_report.return_value = b"PDF content"
        mock_s3.upload_file.return_value = None
        mock_s3.get_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/payroll.pdf"
        
        response = client.post(
            "/api/reports/payroll?start_date=2024-01-01&end_date=2024-01-31",
            headers=auth_headers
        )
        
        # Will fail if no payroll data, but should not be a permission error
        assert response.status_code in [200, 404]
    
    def test_generate_payroll_report_employee(self, client, employee_headers):
        """Test payroll report generation by employee fails."""
        response = client.post(
            "/api/reports/payroll?start_date=2024-01-01&end_date=2024-01-31",
            headers=employee_headers
        )
        
        assert response.status_code == 403
    
    @patch("app.routers.reports.s3_service")
    def test_list_reports(self, mock_s3, client, auth_headers, test_company):
        """Test listing generated reports."""
        mock_s3.list_files.return_value = [
            {
                "Key": f"{test_company.id}/reports/report1.pdf",
                "Size": 2048,
                "LastModified": "2024-01-01T00:00:00",
                "ContentType": "application/pdf"
            }
        ]
        
        response = client.get("/api/reports/list", headers=auth_headers)
        
        assert response.status_code == 200
        result = response.json()
        assert "reports" in result
        assert result["count"] == 1
    
    def test_generate_financial_report_invalid_dates(self, client, auth_headers):
        """Test report generation with invalid date range."""
        response = client.post(
            "/api/reports/financial?start_date=2024-12-31&end_date=2024-01-01&report_type=summary",
            headers=auth_headers
        )
        
        # Should handle gracefully or return error
        assert response.status_code in [200, 400]
