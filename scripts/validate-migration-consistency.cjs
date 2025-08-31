#!/usr/bin/env node

/**
 * Migration Consistency Validator
 * 
 * Validates that:
 * 1. Migration files use consistent column names
 * 2. RLS policies reference correct columns
 * 3. All safety checks are in place
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

const MIGRATION_FILES = {
  tables: '006_missing_tables_safe.sql',
  policies: '007_comprehensive_rls_policies.sql'
};

class MigrationValidator {
  constructor() {
    this.results = {
      tables: {},
      policies: {},
      consistency: []
    };
  }

  async validate() {
    console.log('🔍 Validating Migration Consistency...\n');
    
    try {
      // Read migration files
      const tablesFile = await this.readFile(MIGRATION_FILES.tables);
      const policiesFile = await this.readFile(MIGRATION_FILES.policies);
      
      // Extract column definitions
      this.extractTableColumns(tablesFile);
      
      // Extract policy references
      this.extractPolicyColumns(policiesFile);
      
      // Validate consistency
      this.validateConsistency();
      
      // Report results
      this.generateReport();
      
      return this.results.consistency.length === 0;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  async readFile(filename) {
    const filepath = path.join(MIGRATION_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }
    
    return fs.readFileSync(filepath, 'utf8');
  }

  extractTableColumns(content) {
    const tables = ['reviews', 'notifications', 'file_uploads'];
    
    tables.forEach(tableName => {
      const tableRegex = new RegExp(
        `CREATE TABLE.*${tableName}\\s*\\((.*?)\\);`, 
        'is'
      );
      
      const match = content.match(tableRegex);
      if (match) {
        const columns = this.parseColumns(match[1]);
        this.results.tables[tableName] = columns;
      }
    });
  }

  parseColumns(columnDef) {
    const lines = columnDef.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('--'));
    
    const columns = [];
    
    lines.forEach(line => {
      const columnMatch = line.match(/^(\w+)\s+/);
      if (columnMatch && !['CONSTRAINT', 'PRIMARY', 'FOREIGN'].includes(columnMatch[1])) {
        columns.push(columnMatch[1]);
      }
    });
    
    return columns;
  }

  extractPolicyColumns(content) {
    // Extract column references from RLS policies
    const policyMatches = content.match(/USING\s*\([^)]+\)/gi) || [];
    
    policyMatches.forEach(match => {
      const columns = match.match(/(\w+)\s*[=<>]/g) || [];
      columns.forEach(col => {
        const columnName = col.replace(/\s*[=<>].*/, '');
        if (!this.results.policies[columnName]) {
          this.results.policies[columnName] = [];
        }
        this.results.policies[columnName].push(match);
      });
    });
  }

  validateConsistency() {
    // Check for references to non-existent columns
    Object.keys(this.results.policies).forEach(policyColumn => {
      let found = false;
      
      Object.values(this.results.tables).forEach(tableColumns => {
        if (tableColumns.includes(policyColumn)) {
          found = true;
        }
      });
      
      if (!found) {
        this.results.consistency.push({
          type: 'missing_column',
          column: policyColumn,
          message: `RLS policy references non-existent column: ${policyColumn}`
        });
      }
    });

    // Check for common naming issues
    const commonIssues = [
      { wrong: 'visible', correct: 'is_visible' },
      { wrong: 'flagged', correct: 'is_flagged' },
      { wrong: 'read', correct: 'is_read' },
      { wrong: 'sent', correct: 'is_sent' },
      { wrong: 'verified', correct: 'is_verified' }
    ];

    commonIssues.forEach(issue => {
      if (this.results.policies[issue.wrong]) {
        this.results.consistency.push({
          type: 'naming_convention',
          column: issue.wrong,
          suggestion: issue.correct,
          message: `Consider using '${issue.correct}' instead of '${issue.wrong}' for consistency`
        });
      }
    });
  }

  generateReport() {
    console.log('📊 MIGRATION VALIDATION REPORT');
    console.log('================================\n');
    
    // Tables report
    console.log('📋 Table Columns:');
    Object.entries(this.results.tables).forEach(([table, columns]) => {
      console.log(`  ${table}: ${columns.join(', ')}`);
    });
    console.log();
    
    // Policy columns report
    console.log('🔒 Policy Column References:');
    Object.keys(this.results.policies).forEach(column => {
      console.log(`  ${column}`);
    });
    console.log();
    
    // Consistency issues
    if (this.results.consistency.length === 0) {
      console.log('✅ All consistency checks passed!');
    } else {
      console.log('⚠️  Consistency Issues:');
      this.results.consistency.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
        if (issue.suggestion) {
          console.log(`     Suggestion: Use '${issue.suggestion}'`);
        }
      });
    }
    
    console.log('\n================================');
    console.log(this.results.consistency.length === 0 ? 
      '🎉 Migration files are consistent and ready!' : 
      '🔧 Please fix consistency issues before deploying'
    );
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MigrationValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = MigrationValidator;