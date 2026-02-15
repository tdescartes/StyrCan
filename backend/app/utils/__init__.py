"""Utility functions and helpers."""

from .tenant import (
    get_company_context,
    validate_resource_ownership,
    ValidateCompanyAccess,
    ensure_company_filter,
    log_cross_company_attempt,
)

from .mongo_helpers import (
    find_by_company,
    find_one_by_company,
    count_by_company,
    create_with_company,
    update_by_company,
    delete_by_company,
    validate_company_access_mongo,
    bulk_create_with_company,
)

__all__ = [
    # Tenant utilities
    "get_company_context",
    "validate_resource_ownership",
    "ValidateCompanyAccess",
    "ensure_company_filter",
    "log_cross_company_attempt",
    # MongoDB helpers
    "find_by_company",
    "find_one_by_company",
    "count_by_company",
    "create_with_company",
    "update_by_company",
    "delete_by_company",
    "validate_company_access_mongo",
    "bulk_create_with_company",
]
