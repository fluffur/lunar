# RoomApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**roomsGet**](#roomsget) | **GET** /rooms | List user rooms|
|[**roomsPost**](#roomspost) | **POST** /rooms | Create a new room|
|[**roomsRoomSlugPost**](#roomsroomslugpost) | **POST** /rooms/{roomSlug} | Join current user to room|

# **roomsGet**
> RoomListResponse roomsGet()


### Example

```typescript
import {
    RoomApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoomApi(configuration);

const { status, data } = await apiInstance.roomsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**RoomListResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **roomsPost**
> RoomCreateResponse roomsPost(input)


### Example

```typescript
import {
    RoomApi,
    Configuration,
    RoomCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoomApi(configuration);

let input: RoomCreateRequest; //Room creation params

const { status, data } = await apiInstance.roomsPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **RoomCreateRequest**| Room creation params | |


### Return type

**RoomCreateResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **roomsRoomSlugPost**
> roomsRoomSlugPost()


### Example

```typescript
import {
    RoomApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoomApi(configuration);

let roomSlug: string; //Room Slug (default to undefined)

const { status, data } = await apiInstance.roomsRoomSlugPost(
    roomSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roomSlug** | [**string**] | Room Slug | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

