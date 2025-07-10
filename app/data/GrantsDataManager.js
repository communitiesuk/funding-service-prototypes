class GrantsDataManager {
    constructor(sessionData) {
        this.data = sessionData;
        
        // Initialize grants array if it doesn't exist
        if (!this.data.grants) {
            this.data.grants = [];
        }
    }

    // Helper function to generate unique IDs
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Get all grants
    getGrants() {
        return this.data.grants || [];
    }

    // Get a specific grant by name
    getGrant(grantName) {
        if (!grantName || !this.data.grants) return null;
        return this.data.grants.find(grant => grant.grantName === grantName);
    }

    // Add a new grant
    addGrant(grantData) {
        const newGrant = {
            id: this.generateId(),
            grantName: grantData.grantName || 'Untitled Grant',
            ggisNumber: grantData.ggisNumber || '',
            description: grantData.description || '',
            primaryContactName: grantData.primaryContactName || '',
            primaryContactEmail: grantData.primaryContactEmail || '',
            createdDate: new Date().toLocaleDateString('en-GB'),
            status: 'Active'
        };

        this.data.grants.push(newGrant);
        return newGrant;
    }

    // Update a grant
    updateGrant(grantName, updates) {
        const grant = this.getGrant(grantName);
        if (!grant) return false;

        Object.assign(grant, updates);
        return true;
    }

    // Delete a grant
    deleteGrant(grantName) {
        if (!this.data.grants) return false;
        
        const grantIndex = this.data.grants.findIndex(grant => grant.grantName === grantName);
        if (grantIndex === -1) return false;

        this.data.grants.splice(grantIndex, 1);
        return true;
    }

    // Check if grant name already exists
    grantNameExists(grantName) {
        if (!this.data.grants || !grantName) return false;
        return this.data.grants.some(grant => 
            grant.grantName.toLowerCase() === grantName.toLowerCase()
        );
    }

    // Validate GGIS number format (basic validation)
    validateGgisNumber(ggisNumber) {
        if (!ggisNumber) return false;
        // Basic format: G[1-2]-[A-Z]{3}-[0-9]{4}-[0-9]{2}-[0-9]{5}
        const ggisPattern = /^G[1-2]-[A-Z]{3}-\d{4}-\d{2}-\d{5}$/;
        return ggisPattern.test(ggisNumber);
    }

    // Get grant statistics
    getGrantStats() {
        const grants = this.getGrants();
        return {
            total: grants.length,
            active: grants.filter(g => g.status === 'Active').length,
            inactive: grants.filter(g => g.status === 'Inactive').length
        };
    }
}

module.exports = GrantsDataManager;