// ========================================
// Massage Studio Manager - Application Logic
// ========================================

// Data Store
class DataStore {
    constructor() {
        this.data = {
            clients: [],
            appointments: [],
            services: []
        };
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem('massageStudioData');
            if (stored) {
                this.data = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    save() {
        try {
            localStorage.setItem('massageStudioData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Clients
    getClients() {
        return this.data.clients;
    }

    getClient(id) {
        return this.data.clients.find(c => c.id === id);
    }

    addClient(client) {
        client.id = this.generateId();
        client.createdAt = new Date().toISOString();
        this.data.clients.push(client);
        this.save();
        return client;
    }

    updateClient(id, updates) {
        const index = this.data.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.data.clients[index] = { ...this.data.clients[index], ...updates };
            this.save();
            return this.data.clients[index];
        }
        return null;
    }

    deleteClient(id) {
        this.data.clients = this.data.clients.filter(c => c.id !== id);
        this.data.appointments = this.data.appointments.filter(a => a.clientId !== id);
        this.save();
    }

    // Services
    getServices() {
        return this.data.services;
    }

    getService(id) {
        return this.data.services.find(s => s.id === id);
    }

    addService(service) {
        service.id = this.generateId();
        service.createdAt = new Date().toISOString();
        this.data.services.push(service);
        this.save();
        return service;
    }

    updateService(id, updates) {
        const index = this.data.services.findIndex(s => s.id === id);
        if (index !== -1) {
            this.data.services[index] = { ...this.data.services[index], ...updates };
            this.save();
            return this.data.services[index];
        }
        return null;
    }

    deleteService(id) {
        this.data.services = this.data.services.filter(s => s.id !== id);
        this.data.appointments = this.data.appointments.filter(a => a.serviceId !== id);
        this.save();
    }

    // Appointments
    getAppointments(dateFilter = null) {
        let appointments = [...this.data.appointments];
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            appointments = appointments.filter(a => 
                new Date(a.date).toDateString() === filterDate
            );
        }
        
        return appointments.sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });
    }

    getAppointment(id) {
        return this.data.appointments.find(a => a.id === id);
    }

    addAppointment(appointment) {
        appointment.id = this.generateId();
        appointment.createdAt = new Date().toISOString();
        this.data.appointments.push(appointment);
        this.save();
        return appointment;
    }

    updateAppointment(id, updates) {
        const index = this.data.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.data.appointments[index] = { ...this.data.appointments[index], ...updates };
            this.save();
            return this.data.appointments[index];
        }
        return null;
    }

    deleteAppointment(id) {
        this.data.appointments = this.data.appointments.filter(a => a.id !== id);
        this.save();
    }

    // Statistics
    getStats() {
        const today = new Date().toDateString();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const todayAppointments = this.data.appointments.filter(a => 
            new Date(a.date).toDateString() === today
        );
        
        const weeklyAppointments = this.data.appointments.filter(a => {
            const apptDate = new Date(a.date);
            return apptDate >= weekAgo;
        });
        
        const weeklyRevenue = weeklyAppointments.reduce((sum, a) => {
            const service = this.getService(a.serviceId);
            return sum + (service ? service.price : 0);
        }, 0);
        
        return {
            totalClients: this.data.clients.length,
            todayAppointments: todayAppointments.length,
            weeklyRevenue: weeklyRevenue,
            activeServices: this.data.services.length
        };
    }

    getUpcomingAppointments(days = 7) {
        const today = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        
        return this.data.appointments
            .filter(a => {
                const apptDate = new Date(a.date);
                return apptDate >= today && apptDate <= future;
            })
            .sort((a, b) => {
                const dateCompare = new Date(a.date) - new Date(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.time.localeCompare(b.time);
            });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// UI Controller
class UIController {
    constructor(dataStore) {
        this.store = dataStore;
        this.currentSection = 'dashboard';
        this.editingClientId = null;
        this.editingAppointmentId = null;
        this.editingServiceId = null;
        
        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindModals();
        this.bindForms();
        this.bindSearch();
        this.bindDateFilter();
        this.renderAll();
        this.updateStats();
    }

    // Navigation
    bindNavigation() {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.showSection(sectionId);
                
                // Update aria-current
                document.querySelectorAll('nav a').forEach(l => 
                    l.removeAttribute('aria-current')
                );
                link.setAttribute('aria-current', 'page');
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Focus management
            const heading = targetSection.querySelector('h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
            
            // Re-render content
            this.renderAll();
        }
    }

    // Modals
    bindModals() {
        // Client Modal
        this.setupModal('client-modal', 'add-client-btn', () => {
            this.editingClientId = null;
            document.getElementById('client-form').reset();
            document.getElementById('client-modal-title').textContent = 'Add New Client';
        });

        // Appointment Modal
        this.setupModal('appointment-modal', 'add-appointment-btn', () => {
            this.editingAppointmentId = null;
            document.getElementById('appointment-form').reset();
            document.getElementById('appointment-modal-title').textContent = 'Schedule Appointment';
            this.populateAppointmentSelects();
        });

        // Service Modal
        this.setupModal('service-modal', 'add-service-btn', () => {
            this.editingServiceId = null;
            document.getElementById('service-form').reset();
            document.getElementById('service-modal-title').textContent = 'Add New Service';
        });
    }

    setupModal(modalId, buttonId, onOpen) {
        const modal = document.getElementById(modalId);
        const button = document.getElementById(buttonId);
        
        if (button) {
            button.addEventListener('click', () => {
                onOpen();
                this.openModal(modal);
            });
        }

        // Close buttons
        modal.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Close on Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
            }
        });
    }

    openModal(modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus first input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Trap focus
        this.trapFocus(modal);
    }

    closeModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        // Return focus to trigger button
        const triggerBtn = document.querySelector(`[aria-haspopup][aria-controls="${modal.id}"]`);
        if (triggerBtn) {
            triggerBtn.focus();
        }
    }

    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    // Forms
    bindForms() {
        // Client Form
        const clientForm = document.getElementById('client-form');
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleClientSubmit();
        });

        // Appointment Form
        const appointmentForm = document.getElementById('appointment-form');
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAppointmentSubmit();
        });

        // Service Form
        const serviceForm = document.getElementById('service-form');
        serviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleServiceSubmit();
        });
    }

    handleClientSubmit() {
        const name = document.getElementById('client-name').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        const email = document.getElementById('client-email').value.trim();
        const notes = document.getElementById('client-notes').value.trim();

        if (!name || !phone) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingClientId) {
            this.store.updateClient(this.editingClientId, { name, phone, email, notes });
            this.showToast('Client updated successfully', 'success');
        } else {
            this.store.addClient({ name, phone, email, notes });
            this.showToast('Client added successfully', 'success');
        }

        this.closeModal(document.getElementById('client-modal'));
        this.renderClients();
        this.updateStats();
    }

    handleAppointmentSubmit() {
        const clientId = document.getElementById('appointment-client').value;
        const serviceId = document.getElementById('appointment-service').value;
        const date = document.getElementById('appointment-date').value;
        const time = document.getElementById('appointment-time').value;
        const notes = document.getElementById('appointment-notes').value.trim();

        if (!clientId || !serviceId || !date || !time) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingAppointmentId) {
            this.store.updateAppointment(this.editingAppointmentId, {
                clientId, serviceId, date, time, notes
            });
            this.showToast('Appointment updated successfully', 'success');
        } else {
            this.store.addAppointment({ clientId, serviceId, date, time, notes });
            this.showToast('Appointment scheduled successfully', 'success');
        }

        this.closeModal(document.getElementById('appointment-modal'));
        this.renderAppointments();
        this.updateStats();
    }

    handleServiceSubmit() {
        const name = document.getElementById('service-name').value.trim();
        const duration = parseInt(document.getElementById('service-duration').value);
        const price = parseFloat(document.getElementById('service-price').value);
        const description = document.getElementById('service-description').value.trim();

        if (!name || !duration || !price) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingServiceId) {
            this.store.updateService(this.editingServiceId, { name, duration, price, description });
            this.showToast('Service updated successfully', 'success');
        } else {
            this.store.addService({ name, duration, price, description });
            this.showToast('Service added successfully', 'success');
        }

        this.closeModal(document.getElementById('service-modal'));
        this.renderServices();
        this.updateStats();
    }

    // Search
    bindSearch() {
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.renderClients(query);
            });
        }
    }

    // Date Filter
    bindDateFilter() {
        const dateFilter = document.getElementById('appointment-date-filter');
        const clearFilter = document.getElementById('clear-filter');
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.renderAppointments();
            });
        }
        
        if (clearFilter) {
            clearFilter.addEventListener('click', () => {
                dateFilter.value = '';
                this.renderAppointments();
            });
        }
    }

    // Render Functions
    renderAll() {
        this.renderClients();
        this.renderAppointments();
        this.renderServices();
        this.renderUpcomingAppointments();
    }

    renderClients(searchQuery = '') {
        const clientsList = document.getElementById('clients-list');
        if (!clientsList) return;

        let clients = this.store.getClients();
        
        if (searchQuery) {
            clients = clients.filter(c => 
                c.name.toLowerCase().includes(searchQuery) ||
                c.phone.includes(searchQuery) ||
                c.email.toLowerCase().includes(searchQuery)
            );
        }

        if (clients.length === 0) {
            clientsList.innerHTML = '<p class="empty-state">No clients found. Click "Add Client" to get started.</p>';
            return;
        }

        clientsList.innerHTML = clients.map(client => `
            <div class="client-card" role="listitem" data-id="${client.id}">
                <h4>${this.escapeHtml(client.name)}</h4>
                <p>📱 ${this.escapeHtml(client.phone)}</p>
                ${client.email ? `<p>📧 ${this.escapeHtml(client.email)}</p>` : ''}
                ${client.notes ? `<p>📝 ${this.escapeHtml(client.notes.substring(0, 50))}${client.notes.length > 50 ? '...' : ''}</p>` : ''}
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="app.editClient('${client.id}')">Edit</button>
                    <button class="btn btn-secondary" onclick="app.viewClient('${client.id}')">View</button>
                    <button class="btn btn-danger" onclick="app.deleteClient('${client.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderAppointments() {
        const appointmentsList = document.getElementById('appointments-list');
        if (!appointmentsList) return;

        const dateFilter = document.getElementById('appointment-date-filter');
        const filterValue = dateFilter ? dateFilter.value : null;
        
        let appointments = this.store.getAppointments(filterValue);

        if (appointments.length === 0) {
            const message = filterValue ? 'No appointments found for this date.' : 'No appointments scheduled yet.';
            appointmentsList.innerHTML = `<p class="empty-state">${message}</p>`;
            return;
        }

        appointmentsList.innerHTML = appointments.map(appointment => {
            const client = this.store.getClient(appointment.clientId);
            const service = this.store.getService(appointment.serviceId);
            const date = new Date(appointment.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            return `
                <div class="appointment-item" role="listitem" data-id="${appointment.id}">
                    <h4>${client ? this.escapeHtml(client.name) : 'Unknown Client'}</h4>
                    <div class="appointment-details">
                        <span>📅 ${formattedDate}</span>
                        <span>🕐 ${appointment.time}</span>
                        <span>💆 ${service ? this.escapeHtml(service.name) : 'Unknown Service'} (${service ? service.duration + 'min' : ''})</span>
                        ${service ? `<span>💰 $${service.price.toFixed(2)}</span>` : ''}
                        ${appointment.notes ? `<span>📝 ${this.escapeHtml(appointment.notes)}</span>` : ''}
                    </div>
                    <div class="appointment-actions">
                        <button class="btn btn-secondary" onclick="app.editAppointment('${appointment.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="app.deleteAppointment('${appointment.id}')">Cancel</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderServices() {
        const servicesList = document.getElementById('services-list');
        if (!servicesList) return;

        const services = this.store.getServices();

        if (services.length === 0) {
            servicesList.innerHTML = '<p class="empty-state">No services configured yet. Click "Add Service" to get started.</p>';
            return;
        }

        servicesList.innerHTML = services.map(service => `
            <div class="service-card" role="listitem" data-id="${service.id}">
                <h4>${this.escapeHtml(service.name)}</h4>
                <p>⏱️ ${service.duration} minutes</p>
                <p>💰 $${service.price.toFixed(2)}</p>
                ${service.description ? `<p>${this.escapeHtml(service.description.substring(0, 100))}${service.description.length > 100 ? '...' : ''}</p>` : ''}
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="app.editService('${service.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="app.deleteService('${service.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderUpcomingAppointments() {
        const upcomingList = document.getElementById('upcoming-list');
        if (!upcomingList) return;

        const appointments = this.store.getUpcomingAppointments(7);

        if (appointments.length === 0) {
            upcomingList.innerHTML = '<p class="empty-state">No upcoming appointments in the next 7 days.</p>';
            return;
        }

        upcomingList.innerHTML = appointments.map(appointment => {
            const client = this.store.getClient(appointment.clientId);
            const service = this.store.getService(appointment.serviceId);
            const date = new Date(appointment.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
            });

            return `
                <div class="appointment-item">
                    <h4>${client ? this.escapeHtml(client.name) : 'Unknown Client'}</h4>
                    <div class="appointment-details">
                        <span>📅 ${formattedDate} at ${appointment.time}</span>
                        <span>💆 ${service ? this.escapeHtml(service.name) : 'Unknown Service'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const stats = this.store.getStats();
        
        document.getElementById('client-count').textContent = stats.totalClients;
        document.getElementById('today-count').textContent = stats.todayAppointments;
        document.getElementById('revenue-count').textContent = '$' + stats.weeklyRevenue.toFixed(2);
        document.getElementById('services-count').textContent = stats.activeServices;
    }

    populateAppointmentSelects() {
        const clientSelect = document.getElementById('appointment-client');
        const serviceSelect = document.getElementById('appointment-service');
        
        // Populate clients
        const clients = this.store.getClients();
        clientSelect.innerHTML = '<option value="">Select a client</option>' +
            clients.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
        
        // Populate services
        const services = this.store.getServices();
        serviceSelect.innerHTML = '<option value="">Select a service</option>' +
            services.map(s => `<option value="${s.id}">${this.escapeHtml(s.name)} - $${s.price.toFixed(2)}</option>`).join('');
    }

    // Actions
    editClient(id) {
        const client = this.store.getClient(id);
        if (!client) return;
        
        this.editingClientId = id;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-notes').value = client.notes || '';
        document.getElementById('client-modal-title').textContent = 'Edit Client';
        
        this.openModal(document.getElementById('client-modal'));
    }

    viewClient(id) {
        const client = this.store.getClient(id);
        if (!client) return;
        
        const content = document.getElementById('view-client-content');
        content.innerHTML = `
            <div class="modal-form">
                <div class="form-group">
                    <label><strong>Name:</strong></label>
                    <p>${this.escapeHtml(client.name)}</p>
                </div>
                <div class="form-group">
                    <label><strong>Phone:</strong></label>
                    <p>${this.escapeHtml(client.phone)}</p>
                </div>
                ${client.email ? `
                    <div class="form-group">
                        <label><strong>Email:</strong></label>
                        <p>${this.escapeHtml(client.email)}</p>
                    </div>
                ` : ''}
                ${client.notes ? `
                    <div class="form-group">
                        <label><strong>Notes:</strong></label>
                        <p>${this.escapeHtml(client.notes)}</p>
                    </div>
                ` : ''}
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-modal">Close</button>
                </div>
            </div>
        `;
        
        this.openModal(document.getElementById('view-client-modal'));
    }

    deleteClient(id) {
        if (!confirm('Are you sure you want to delete this client? All their appointments will also be deleted.')) {
            return;
        }
        
        this.store.deleteClient(id);
        this.renderClients();
        this.updateStats();
        this.showToast('Client deleted successfully', 'success');
    }

    editAppointment(id) {
        const appointment = this.store.getAppointment(id);
        if (!appointment) return;
        
        this.editingAppointmentId = id;
        this.populateAppointmentSelects();
        
        document.getElementById('appointment-client').value = appointment.clientId;
        document.getElementById('appointment-service').value = appointment.serviceId;
        document.getElementById('appointment-date').value = appointment.date;
        document.getElementById('appointment-time').value = appointment.time;
        document.getElementById('appointment-notes').value = appointment.notes || '';
        document.getElementById('appointment-modal-title').textContent = 'Edit Appointment';
        
        this.openModal(document.getElementById('appointment-modal'));
    }

    deleteAppointment(id) {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }
        
        this.store.deleteAppointment(id);
        this.renderAppointments();
        this.updateStats();
        this.showToast('Appointment cancelled', 'success');
    }

    editService(id) {
        const service = this.store.getService(id);
        if (!service) return;
        
        this.editingServiceId = id;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-duration').value = service.duration;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-description').value = service.description || '';
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        
        this.openModal(document.getElementById('service-modal'));
    }

    deleteService(id) {
        if (!confirm('Are you sure you want to delete this service? All appointments for this service will also be deleted.')) {
            return;
        }
        
        this.store.deleteService(id);
        this.renderServices();
        this.updateStats();
        this.showToast('Service deleted successfully', 'success');
    }

    // Utilities
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize App
const store = new DataStore();
const app = new UIController(store);

// Expose to window for inline onclick handlers
window.app = app;