# MessageApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**roomsRoomSlugMessagesGet**](#roomsroomslugmessagesget) | **GET** /rooms/{roomSlug}/messages | List messages in a room|

# **roomsRoomSlugMessagesGet**
> MessageGetPagingResponse roomsRoomSlugMessagesGet()


### Example

```typescript
import {
    MessageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MessageApi(configuration);

let roomSlug: string; //Room Slug (default to undefined)
let limit: number; //Limit (optional) (default to undefined)
let cursor: string; //Cursor (optional) (default to undefined)

const { status, data } = await apiInstance.roomsRoomSlugMessagesGet(
    roomSlug,
    limit,
    cursor
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roomSlug** | [**string**] | Room Slug | defaults to undefined|
| **limit** | [**number**] | Limit | (optional) defaults to undefined|
| **cursor** | [**string**] | Cursor | (optional) defaults to undefined|


### Return type

**MessageGetPagingResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

