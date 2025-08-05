'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    // Insert Drivers
    await queryInterface.bulkInsert('drivers', [
      {
        id: 1,
        name: 'John Smith',
        type: 'transporter',
        transport_company: 'Swift Transportation',
        phone: '555-0101',
        license_number: 'CDL-TX-001234',
        employee_id: null,
        department: null,
        hire_date: null,
        overall_rating: 4.5,
        total_deliveries: 23,
        last_delivery: oneWeekAgo,
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      },
      {
        id: 2,
        name: 'Maria Rodriguez',
        type: 'in_house',
        transport_company: null,
        phone: '555-0102',
        license_number: 'CDL-TX-001235',
        employee_id: 'EMP-2024-001',
        department: 'Logistics',
        hire_date: '2024-01-15',
        overall_rating: 4.8,
        total_deliveries: 31,
        last_delivery: twoWeeksAgo,
        created_at: oneMonthAgo,
        updated_at: twoWeeksAgo
      },
      {
        id: 3,
        name: 'Ahmed Hassan',
        type: 'transporter',
        transport_company: 'Express Logistics',
        phone: '555-0103',
        license_number: 'CDL-TX-001236',
        employee_id: null,
        department: null,
        hire_date: null,
        overall_rating: 3.9,
        total_deliveries: 18,
        last_delivery: oneWeekAgo,
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      },
      {
        id: 4,
        name: 'Sarah Johnson',
        type: 'in_house',
        transport_company: null,
        phone: '555-0104',
        license_number: 'CDL-TX-001237',
        employee_id: 'EMP-2024-002',
        department: 'Operations',
        hire_date: '2024-03-10',
        overall_rating: 4.2,
        total_deliveries: 15,
        last_delivery: twoWeeksAgo,
        created_at: oneMonthAgo,
        updated_at: twoWeeksAgo
      },
      {
        id: 5,
        name: 'Mike Thompson',
        type: 'transporter',
        transport_company: 'Roadway Express',
        phone: '555-0105',
        license_number: 'CDL-TX-001238',
        employee_id: null,
        department: null,
        hire_date: null,
        overall_rating: 4.6,
        total_deliveries: 27,
        last_delivery: oneWeekAgo,
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      },
      {
        id: 6,
        name: 'Lisa Chang',
        type: 'in_house',
        transport_company: null,
        phone: '555-0106',
        license_number: 'CDL-TX-001239',
        employee_id: 'EMP-2024-003',
        department: 'Logistics',
        hire_date: '2024-02-20',
        overall_rating: 4.4,
        total_deliveries: 22,
        last_delivery: oneWeekAgo,
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      }
    ], {});

    // Insert Transportation Requests
    await queryInterface.bulkInsert('transportation_requests', [
      {
        id: 1,
        request_number: 'REQ-2025-001',
        origin: 'Houston, TX',
        destination: 'Dallas, TX',
        estimated_distance: 239.5,
        pickup_datetime: oneWeekAgo,
        truck_count: 2,
        truck_type: 'box',
        load_details: 'Electronic equipment and components',
        special_requirements: 'Handle with care, fragile items',
        estimated_cost: 2850.00,
        urgency_level: 'medium',
        status: 'completed',
        created_by: 'Sarah Williams',
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      },
      {
        id: 2,
        request_number: 'REQ-2025-002',
        origin: 'Austin, TX',
        destination: 'San Antonio, TX',
        estimated_distance: 80.2,
        pickup_datetime: twoWeeksAgo,
        truck_count: 1,
        truck_type: 'flatbed',
        load_details: 'Construction materials and steel beams',
        special_requirements: 'Requires secure tie-downs',
        estimated_cost: 1200.00,
        urgency_level: 'high',
        status: 'completed',
        created_by: 'Robert Brown',
        created_at: oneMonthAgo,
        updated_at: twoWeeksAgo
      },
      {
        id: 3,
        request_number: 'REQ-2025-003',
        origin: 'Dallas, TX',
        destination: 'Fort Worth, TX',
        estimated_distance: 32.1,
        pickup_datetime: oneWeekAgo,
        truck_count: 3,
        truck_type: 'refrigerated',
        load_details: 'Fresh produce and dairy products',
        special_requirements: 'Temperature control required: 35-38°F',
        estimated_cost: 950.00,
        urgency_level: 'urgent',
        status: 'completed',
        created_by: 'Jennifer Davis',
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      },
      {
        id: 4,
        request_number: 'REQ-2025-004',
        origin: 'Houston, TX',
        destination: 'Austin, TX',
        estimated_distance: 165.3,
        pickup_datetime: tomorrow,
        truck_count: 1,
        truck_type: 'semi',
        load_details: 'Industrial machinery parts',
        special_requirements: 'Heavy load, experienced driver required',
        estimated_cost: 2100.00,
        urgency_level: 'medium',
        status: 'planned',
        created_by: 'Michael Wilson',
        created_at: twoWeeksAgo,
        updated_at: twoWeeksAgo
      },
      {
        id: 5,
        request_number: 'REQ-2025-005',
        origin: 'San Antonio, TX',
        destination: 'Houston, TX',
        estimated_distance: 197.8,
        pickup_datetime: twoWeeksAgo,
        truck_count: 2,
        truck_type: 'box',
        load_details: 'Office furniture and supplies',
        special_requirements: null,
        estimated_cost: 1875.00,
        urgency_level: 'low',
        status: 'completed',
        created_by: 'Amanda Taylor',
        created_at: oneMonthAgo,
        updated_at: twoWeeksAgo
      },
      {
        id: 6,
        request_number: 'REQ-2025-006',
        origin: 'El Paso, TX',
        destination: 'Dallas, TX',
        estimated_distance: 563.2,
        pickup_datetime: oneWeekAgo,
        truck_count: 1,
        truck_type: 'flatbed',
        load_details: 'Solar panel equipment',
        special_requirements: 'Weather protection covers required',
        estimated_cost: 4250.00,
        urgency_level: 'medium',
        status: 'completed',
        created_by: 'David Anderson',
        created_at: oneMonthAgo,
        updated_at: oneWeekAgo
      }
    ], {});

    // Insert Deliveries (only for completed requests)
    await queryInterface.bulkInsert('deliveries', [
      {
        id: 1,
        request_id: 1,
        actual_pickup_datetime: new Date(oneWeekAgo.getTime() + 30 * 60 * 1000),
        actual_truck_count: 2,
        invoice_amount: 2795.50,
        delivery_notes: 'Delivery completed successfully. Customer satisfied with service.',
        logged_by: 'System',
        logged_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
        created_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000)
      },
      {
        id: 2,
        request_id: 2,
        actual_pickup_datetime: twoWeeksAgo,
        actual_truck_count: 1,
        invoice_amount: 1350.00,
        delivery_notes: 'Steel beams delivered safely. Construction crew was ready for immediate unloading.',
        logged_by: 'System',
        logged_at: new Date(twoWeeksAgo.getTime() + 6 * 60 * 60 * 1000),
        created_at: new Date(twoWeeksAgo.getTime() + 6 * 60 * 60 * 1000),
        updated_at: new Date(twoWeeksAgo.getTime() + 6 * 60 * 60 * 1000)
      },
      {
        id: 3,
        request_id: 3,
        actual_pickup_datetime: new Date(oneWeekAgo.getTime() - 15 * 60 * 1000),
        actual_truck_count: 3,
        invoice_amount: 925.00,
        delivery_notes: 'Temperature maintained throughout delivery. All produce arrived fresh.',
        logged_by: 'System',
        logged_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
        created_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        id: 4,
        request_id: 5,
        actual_pickup_datetime: new Date(twoWeeksAgo.getTime() + 45 * 60 * 1000),
        actual_truck_count: 2,
        invoice_amount: 1920.00,
        delivery_notes: 'Minor delay due to traffic. All furniture delivered in good condition.',
        logged_by: 'System',
        logged_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000),
        created_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000),
        updated_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000)
      },
      {
        id: 5,
        request_id: 6,
        actual_pickup_datetime: new Date(oneWeekAgo.getTime() + 20 * 60 * 1000),
        actual_truck_count: 1,
        invoice_amount: 4180.00,
        delivery_notes: 'Solar panels delivered with proper weather protection. Installation team ready.',
        logged_by: 'System',
        logged_at: new Date(oneWeekAgo.getTime() + 10 * 60 * 60 * 1000),
        created_at: new Date(oneWeekAgo.getTime() + 10 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 10 * 60 * 60 * 1000)
      }
    ], {});

    // Insert Driver Ratings
    await queryInterface.bulkInsert('driver_ratings', [
      {
        id: 1,
        delivery_id: 1,
        driver_id: 1,
        punctuality: 4,
        professionalism: 5,
        delivery_quality: 4,
        communication: 5,
        safety: 5,
        policy_compliance: 4,
        fuel_efficiency: 4,
        overall_rating: 4,
        comments: 'Excellent driver, very professional and courteous. Minor delay but handled well.',
        created_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000)
      },
      {
        id: 2,
        delivery_id: 1,
        driver_id: 2,
        punctuality: 4,
        professionalism: 5,
        delivery_quality: 5,
        communication: 5,
        safety: 5,
        policy_compliance: 5,
        fuel_efficiency: 5,
        overall_rating: 5,
        comments: 'Outstanding performance. Very experienced and reliable driver.',
        created_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000)
      },
      {
        id: 3,
        delivery_id: 2,
        driver_id: 3,
        punctuality: 5,
        professionalism: 4,
        delivery_quality: 4,
        communication: 4,
        safety: 4,
        policy_compliance: 4,
        fuel_efficiency: 3,
        overall_rating: 4,
        comments: 'Good performance. On time delivery with proper handling of steel materials.',
        created_at: new Date(twoWeeksAgo.getTime() + 6 * 60 * 60 * 1000),
        updated_at: new Date(twoWeeksAgo.getTime() + 6 * 60 * 60 * 1000)
      },
      {
        id: 4,
        delivery_id: 3,
        driver_id: 4,
        punctuality: 5,
        professionalism: 4,
        delivery_quality: 5,
        communication: 4,
        safety: 5,
        policy_compliance: 5,
        fuel_efficiency: 4,
        overall_rating: 5,
        comments: 'Excellent handling of refrigerated goods. Temperature maintained perfectly.',
        created_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        id: 5,
        delivery_id: 3,
        driver_id: 6,
        punctuality: 5,
        professionalism: 5,
        delivery_quality: 4,
        communication: 5,
        safety: 4,
        policy_compliance: 4,
        fuel_efficiency: 4,
        overall_rating: 4,
        comments: 'Very professional and punctual. Good coordination with team.',
        created_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        id: 6,
        delivery_id: 3,
        driver_id: 5,
        punctuality: 5,
        professionalism: 5,
        delivery_quality: 5,
        communication: 4,
        safety: 5,
        policy_compliance: 5,
        fuel_efficiency: 5,
        overall_rating: 5,
        comments: 'Exceptional performance. Early delivery with perfect temperature control.',
        created_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        id: 7,
        delivery_id: 4,
        driver_id: 1,
        punctuality: 3,
        professionalism: 4,
        delivery_quality: 4,
        communication: 4,
        safety: 4,
        policy_compliance: 4,
        fuel_efficiency: 3,
        overall_rating: 4,
        comments: 'Delivery completed but had some traffic delays. Good communication throughout.',
        created_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000),
        updated_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000)
      },
      {
        id: 8,
        delivery_id: 4,
        driver_id: 3,
        punctuality: 3,
        professionalism: 4,
        delivery_quality: 5,
        communication: 3,
        safety: 4,
        policy_compliance: 4,
        fuel_efficiency: 4,
        overall_rating: 4,
        comments: 'Good handling of furniture. Room for improvement in punctuality.',
        created_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000),
        updated_at: new Date(twoWeeksAgo.getTime() + 7 * 60 * 60 * 1000)
      },
      {
        id: 9,
        delivery_id: 5,
        driver_id: 5,
        punctuality: 4,
        professionalism: 5,
        delivery_quality: 5,
        communication: 5,
        safety: 5,
        policy_compliance: 5,
        fuel_efficiency: 4,
        overall_rating: 5,
        comments: 'Long haul delivery completed perfectly. Solar panels arrived in excellent condition.',
        created_at: new Date(oneWeekAgo.getTime() + 10 * 60 * 60 * 1000),
        updated_at: new Date(oneWeekAgo.getTime() + 10 * 60 * 60 * 1000)
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order to respect foreign key constraints
    await queryInterface.bulkDelete('driver_ratings', null, {});
    await queryInterface.bulkDelete('deliveries', null, {});
    await queryInterface.bulkDelete('transportation_requests', null, {});
    await queryInterface.bulkDelete('drivers', null, {});
  }
};