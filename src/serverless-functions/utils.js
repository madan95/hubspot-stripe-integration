const BASE_API_URL = "https://api.hubapi.com/hubdb/api/v2";
const BASE_ASSOCIATIONS_API_URL = "https://api.hubapi.com/crm-associations/v1/associations";
const BASE_ENGAGEMENT_API_URL = "https://api.hubapi.com/engagements/v1/engagements";
const BASE_DEAL_API_URL = "https://api.hubapi.com/deals/v1/deal";
const APIKEY = process.env.HUBSPOT_INTEGRATIONS_API_KEY;
const axios = require('axios');

// Get dynamic table_id based on table name.
const getTableDetails = (table_name) => {
    const getTableDetailsUrl = `${BASE_API_URL}/tables?hapikey=${APIKEY}`;
    return axios.get(getTableDetailsUrl)
        .then(res => {
            const tables = res.data.objects;
            if (tables.length) {
                const table = tables.find(table => table.name === table_name);
                return {
                    tables: tables,
                    table: table,
                    table_id: table.id
                }
            }
        });
}

// Get dynamic table_id & column_id based on table & column.
const getColumnId = (table_name, column_name) => {
    return getTableDetails(table_name).then(table_details => {
        const table = table_details.table;
        if (table.columns.length) {
            const column = table.columns.find(column => column.name === column_name);
            return {
                ...table_details,
                columns: table.colmuns,
                column: column,
                column_id: column.id,
            };
        }
    });
}

// Update a table column value.
const updateColumnValue = (table_name, column_name, row_id, value) => {
    const updateColumnUrl = (table_id, row_id, column_id) => `${BASE_API_URL}/tables/${table_id}/rows/${row_id}/cells/${column_id}?hapikey=${APIKEY}`;
    return getColumnId(table_name, column_name).then(details => {
        const column_id = details.column_id;
        const table_id = details.table_id;
        const url = updateColumnUrl(table_id, row_id, column_id);
        console.log("UPDATEING COLUMN " + url);
        console.log(value);
        return axios({
            method: 'PUT',
            url: url,
            data: {
                value: value
            }
        }).then(col_result => {
            console.log("col updated.");
            console.log(` table id: ${details.table_id}`);
            return publishTable(details.table_id)
                .then(res => {
                    console.log("tale pulished");
                    return col_result.data
                });
        });
    });
}

// Get row of a table by row id.
const getTableRowById = (table_name, row_id) => {
    const getRowByIdUrl = (table_id, row_id) => `${BASE_API_URL}/tables/${table_id}/rows/${row_id}?hapikey=${APIKEY}`;
    return getTableDetails(table_name).then(table_details => {
        return axios.get(getRowByIdUrl(table_details.table_id, row_id))
            .then(res => {
                const row = res.data;
                return convertHubdbKeyValues(table_name, row.values)
                    .then(details => {
                        return {
                            ...row,
                            transformed: details
                        };
                    });
            });
    });
}

// Get rows from query
const getTableRowQuery = (table_name, query) => {
    const getRowByQueryUrl = (table_id, query) => `${BASE_API_URL}/tables/${table_id}/rows?hapikey=${APIKEY}&` + query;
    return getTableDetails(table_name).then(table_details => {
        return axios.get(getRowByQueryUrl(table_details.table_id, query))
            .then(res => {
                const promises = res.data.objects.map(item => convertHubdbKeyValues(table_name, item.values))
                return Promise.all(promises)
            });
    });
}

// need to pulish any update or new row on table.
const publishTable = (table_id) => {
    const url = `${BASE_API_URL}/tables/${table_id}/publish?hapikey=${APIKEY}`;
    console.log("publishing table");
    console.log(url);
    return axios.put(url).then(res => res.data);
}

// Create a new tale row & pulish it.
const createTableRow = (table_name, params) => {
    return getTableDetails(table_name)
        .then(table_details => {
            const url = `${BASE_API_URL}/tables/${table_details.table_id}/rows?hapikey=${APIKEY}`
            if (params) {
                const data = params;
                if (params.values) {
                    const transformed_values = mapHubdbColumnNameToIds(table_details.table.columns, params.values);
                    data.values = transformed_values;
                }
                return axios.post(url, data)
                    .then(rows_result => {
                        return publishTable(table_details.table_id)
                            .then(res => rows_result.data);
                    });
            }
            return axios.post(url, {}).then(res => res.data);
        });
}

// Update table row & publish it.
/*const updateTableRow = (table_name, row_id, params) => {
    return getTableDetails(table_name)
        .then(table_details => {
            const url = `${BASE_API_URL}/tables/${table_details.table_id}/rows/${row_id}?hapikey=${APIKEY}`;
            if (params) {
                const data = params;
                if (params.values) {
                    const transformed_values = mapHubdbColumnNameToIds(table_details.table.columns, params.values);
                    if(table_name == 'session-bookings')
                    {
                        data.path = row_id.toString();
                    }
                }
                return axios.put(url, data).then(row_result => {
                    return publishTable(table_details.table_id)
                        .then(res => row_result.data);
                });
            }
            return axios.put(url, {}).then(row_result => {
                return publishTable(table_details.table_id)
                    .then(res => row_result.data);
            });
        })
}*/
const updateTableRow = (table_name, row_id, params) => {
    return getTableDetails(table_name)
        .then(table_details => {
            const url = `${BASE_API_URL}/tables/${table_details.table_id}/rows/${row_id}?hapikey=${APIKEY}`;
            const data = '{"path": "' + row_id.toString() + '",}';
            return axios.put(url, data).then(row_result => {
                return publishTable(table_details.table_id)
                    .then(res => row_result.data);
            });
        })
}
// Get associations of a object on a definition type.
// list of definition_id: https://legacydocs.hubspot.com/docs/methods/crm-associations/crm-associations-overview
const getAssociations = (object_id, definition_id) => {
    return axios.get(`${BASE_ASSOCIATIONS_API_URL}/${object_id}/HUBSPOT_DEFINED/${definition_id}?hapikey=${APIKEY}`)
        .then(res => {
            console.log(res.data);
            return res.data;
        });
}

const getEngagement = (engagement_id) => {
    return axios.get(`${BASE_ENGAGEMENT_API_URL}/${engagement_id}?hapikey=${APIKEY}`)
        .then(res => {
            console.log(res.data);
            return res.data;
        });
}

const createDeal = (params) => {
    return axios(
        {
            method: 'POST',
            url: `${BASE_DEAL_API_URL}?hapikey=${APIKEY}`,
            data: params
        })
        .then(res => {
            console.log("creating deal.");
            return res.data;
        })
}

const createAssociation = (params) => {
    return axios({
        method: 'PUT',
        url: `${BASE_ASSOCIATIONS_API_URL}?hapikey=${APIKEY}`,
        data: params
    })
        .then(res => {
            console.log("created association");
            return res.data;
        });
}

// Convert id, value (key values) to column_name, value pairs.
const convertHubdbKeyValues = (table_name, values) => {
    return getTableDetails(table_name).then(table_details => {
        const columns = table_details.table.columns;
        return mapHudbIdsToColumnName(columns, values)
    });
}

// Plain Utils
const mapObject = (obj, fn) => Object.fromEntries(Object.entries(obj).map(fn));
const getColumnNameFromId = (columns, id) => {
    const column = columns.find(column => Number(column.id) === Number(id));
    return column ? column.name : undefined;
}
const getIdFromColumnName = (columns, name) => {
    const column = columns.find(column => String(column.name) === String(name));
    return column ? column.id : undefined;
}
// Map row column values from id to column name value pair.
const mapHudbIdsToColumnName = (columns, key_value_object) => {
    return mapObject(key_value_object, ([key, value]) => {
        const name = getColumnNameFromId(columns, key);
        if (name) {
            return [name, value];
        }
        return [key, value];

    });
}

// Map column name to ids.
const mapHubdbColumnNameToIds = (columns, name_value_object) => {
    return mapObject(name_value_object, ([name, value]) => {
        const key = getIdFromColumnName(columns, name);
        console.log(`name: ${name}`);
        console.log(`key: ${key}`);
        if (key) {
            return [key, value];
        }
        return [key, value];
    })
}

module.exports = {
    getTableDetails: getTableDetails,
    getColumnId: getColumnId,
    updateColumnValue: updateColumnValue,
    getTableRowById: getTableRowById,
    getTableRowQuery: getTableRowQuery,
    convertHubdbKeyValues: convertHubdbKeyValues,
    getAssociations: getAssociations,
    getEngagement: getEngagement,
    createTableRow: createTableRow,
    updateTableRow: updateTableRow,
    createDeal: createDeal,
    createAssociation: createAssociation,
};
