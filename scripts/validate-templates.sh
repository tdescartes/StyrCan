#!/bin/bash
# Validation script for GitHub issue templates

echo "🔍 Validating GitHub Issue Templates..."
echo "=================================="

template_dir=".github/ISSUE_TEMPLATE"
error_count=0

# Check if template directory exists
if [ ! -d "$template_dir" ]; then
    echo "❌ Issue template directory not found!"
    exit 1
fi

echo "📁 Found issue template directory"

# Count templates
template_count=$(find "$template_dir" -name "*.md" | wc -l)
echo "📄 Found $template_count issue templates"

# Validate each template
for template in "$template_dir"/*.md; do
    if [ -f "$template" ]; then
        filename=$(basename "$template")
        echo "🔍 Validating $filename..."
        
        # Check for required frontmatter
        if ! grep -q "^---$" "$template"; then
            echo "  ❌ Missing frontmatter delimiters"
            ((error_count++))
        fi
        
        if ! grep -q "^name:" "$template"; then
            echo "  ❌ Missing 'name' field"
            ((error_count++))
        fi
        
        if ! grep -q "^about:" "$template"; then
            echo "  ❌ Missing 'about' field"
            ((error_count++))
        fi
        
        if ! grep -q "^title:" "$template"; then
            echo "  ❌ Missing 'title' field"
            ((error_count++))
        fi
        
        if ! grep -q "^labels:" "$template"; then
            echo "  ❌ Missing 'labels' field"
            ((error_count++))
        fi
        
        # Check for required sections
        if ! grep -q "## Description" "$template"; then
            echo "  ❌ Missing 'Description' section"
            ((error_count++))
        fi
        
        if ! grep -q "## .*Requirements\|## API Documentation\|## Infrastructure Requirements" "$template"; then
            echo "  ❌ Missing 'Requirements' section"
            ((error_count++))
        fi
        
        if ! grep -q "## Acceptance Criteria" "$template"; then
            echo "  ❌ Missing 'Acceptance Criteria' section"
            ((error_count++))
        fi
        
        if ! grep -q "## Dependencies" "$template"; then
            echo "  ❌ Missing 'Dependencies' section"
            ((error_count++))
        fi
        
        if ! grep -q "## Estimated Effort" "$template"; then
            echo "  ❌ Missing 'Estimated Effort' section"
            ((error_count++))
        fi
        
        if [ $error_count -eq 0 ]; then
            echo "  ✅ Template is valid"
        fi
    fi
done

# Check config.yml
config_file="$template_dir/config.yml"
if [ -f "$config_file" ]; then
    echo "🔍 Validating config.yml..."
    if grep -q "blank_issues_enabled:" "$config_file"; then
        echo "  ✅ Config file is valid"
    else
        echo "  ❌ Config file missing required fields"
        ((error_count++))
    fi
else
    echo "❌ Missing config.yml file"
    ((error_count++))
fi

echo "=================================="
if [ $error_count -eq 0 ]; then
    echo "✅ All templates are valid!"
    echo "🎉 Ready to create $template_count GitHub issues"
else
    echo "❌ Found $error_count validation errors"
    exit 1
fi