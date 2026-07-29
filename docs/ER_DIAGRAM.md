# Courier Management System — ER Diagram

```mermaid
erDiagram
    users ||--o| customers : "1:1 profile"
    users ||--o| admins : "1:1 profile"
    users ||--o| delivery_agents : "1:1 profile"
    users ||--o{ shipments : "places (customer)"
    users ||--o{ tracking_history : "records"
    users ||--o{ notifications : "receives"
    users ||--o{ payments : "pays"
    users ||--o{ branches : "manages"
    users ||--o{ audit_logs : "performs"

    customers }o--|| users : "user_id FK"
    admins }o--|| users : "user_id FK"
    delivery_agents }o--|| users : "user_id FK"

    warehouses ||--o{ branches : "houses"
    warehouses ||--o{ vehicles : "stores"

    branches }o--|| warehouses : "warehouse_id FK"
    branches ||--o{ vehicles : "operates"
    branches ||--o{ delivery_agents : "employs"
    branches ||--o{ shipments : "origin"
    branches ||--o{ shipments : "destination"

    delivery_agents ||--o| vehicles : "drives (1:1)"
    delivery_agents ||--o{ shipments : "assigned to"

    vehicles }o--|| branches : "branch_id FK"
    vehicles }o--o| delivery_agents : "driver_id FK"
    vehicles }o--o| warehouses : "current_warehouse_id FK"

    shipments }o--o| users : "customer_id FK"
    shipments }o--o| delivery_agents : "assigned_agent_id FK"
    shipments }o--o| branches : "origin_branch_id FK"
    shipments }o--o| branches : "destination_branch_id FK"
    shipments ||--o{ tracking_history : "has events"
    shipments ||--o{ notifications : "triggers"
    shipments ||--|| payments : "billed"

    tracking_history }o--|| shipments : "shipment_id FK"
    tracking_history }o--o| users : "recorded_by FK"

    notifications }o--|| users : "user_id FK"
    notifications }o--o| shipments : "shipment_id FK"

    payments }o--|| shipments : "shipment_id FK"
    payments }o--o| users : "customer_id FK"

    audit_logs }o--o| users : "user_id FK"

    users {
        uuid id PK
        text email UK
        text password
        text name
        user_role role
        text phone
        text avatar_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    customers {
        uuid id PK
        uuid user_id FK_UK
        text company_name
        text company_reg
        text billing_address
        text default_address
        decimal credit_limit
        int total_shipments
        timestamptz created_at
        timestamptz updated_at
    }

    admins {
        uuid id PK
        uuid user_id FK_UK
        text department
        int access_level
        text_array permissions
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    delivery_agents {
        uuid id PK
        uuid user_id FK_UK
        text license_number
        date license_expiry
        uuid vehicle_id FK
        agent_status status
        decimal rating
        int total_deliveries
        float current_latitude
        float current_longitude
        uuid branch_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    warehouses {
        uuid id PK
        text name
        text code UK
        text address
        text city
        text state
        text postal_code
        text country
        float latitude
        float longitude
        int capacity
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    branches {
        uuid id PK
        text name
        text code UK
        text address
        text city
        text state
        text postal_code
        text phone
        text email
        uuid warehouse_id FK
        uuid manager_id FK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    vehicles {
        uuid id PK
        text registration UK
        vehicle_type type
        text model
        decimal capacity_weight
        decimal capacity_volume
        vehicle_status status
        uuid branch_id FK
        uuid driver_id FK_UK
        uuid current_warehouse_id FK
        date last_service_at
        date next_service_at
        timestamptz created_at
        timestamptz updated_at
    }

    shipments {
        uuid id PK
        text tracking_number UK
        shipment_status status
        service_type service_type
        text sender_name
        text sender_phone
        text sender_address
        text sender_city
        text sender_state
        text sender_postal_code
        float sender_latitude
        float sender_longitude
        text recipient_name
        text recipient_phone
        text recipient_address
        text recipient_city
        text recipient_state
        text recipient_postal_code
        float recipient_latitude
        float recipient_longitude
        decimal weight
        text dimensions
        decimal declared_value
        text notes
        timestamptz estimated_delivery
        timestamptz actual_delivery
        float current_latitude
        float current_longitude
        uuid customer_id FK
        uuid assigned_agent_id FK
        uuid origin_branch_id FK
        uuid destination_branch_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    tracking_history {
        uuid id PK
        uuid shipment_id FK
        tracking_event_type event_type
        text message
        float latitude
        float longitude
        text city
        uuid recorded_by FK
        timestamptz timestamp
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid shipment_id FK
        notification_type type
        notification_status status
        text title
        text message
        timestamptz created_at
        timestamptz read_at
    }

    payments {
        uuid id PK
        uuid shipment_id FK
        uuid customer_id FK
        decimal amount
        text currency
        payment_method method
        payment_status status
        text transaction_ref
        timestamptz payment_date
        timestamptz created_at
        timestamptz updated_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
        text ip_address
        text user_agent
        timestamptz created_at
    }
```

## Relationship Summary

| Table | Relates To | Type | FK | Cascade |
|-------|-----------|------|-----|---------|
| customers | users | N:1 | user_id | CASCADE |
| admins | users | N:1 | user_id | CASCADE |
| delivery_agents | users | N:1 | user_id | CASCADE |
| delivery_agents | vehicles | N:1 | vehicle_id | SET NULL |
| delivery_agents | branches | N:1 | branch_id | SET NULL |
| branches | warehouses | N:1 | warehouse_id | CASCADE |
| branches | users (manager) | N:1 | manager_id | SET NULL |
| vehicles | branches | N:1 | branch_id | CASCADE |
| vehicles | delivery_agents | N:1 | driver_id | SET NULL |
| vehicles | warehouses | N:1 | current_warehouse_id | SET NULL |
| shipments | users (customer) | N:1 | customer_id | SET NULL |
| shipments | delivery_agents | N:1 | assigned_agent_id | SET NULL |
| shipments | branches (origin) | N:1 | origin_branch_id | SET NULL |
| shipments | branches (dest) | N:1 | destination_branch_id | SET NULL |
| tracking_history | shipments | N:1 | shipment_id | CASCADE |
| tracking_history | users | N:1 | recorded_by | SET NULL |
| notifications | users | N:1 | user_id | CASCADE |
| notifications | shipments | N:1 | shipment_id | CASCADE |
| payments | shipments | N:1 | shipment_id | CASCADE |
| payments | users | N:1 | customer_id | SET NULL |
| audit_logs | users | N:1 | user_id | CASCADE |

## Normalization (3NF)

- **1NF**: All columns are atomic; no repeating groups.
- **2NF**: No partial dependencies — every non-key attribute depends on the full primary key.
- **3NF**: No transitive dependencies — role-specific data is in separate tables (customers, admins, delivery_agents) rather than in the users table; warehouse/branch/vehicle data is normalized into separate entities.
