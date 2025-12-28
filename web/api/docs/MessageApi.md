# MessageApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**chatsChatIDMessagesGet**](#chatschatidmessagesget) | **GET** /chats/{chatID}/messages | List messages in a chat|

# **chatsChatIDMessagesGet**
> MessageGetPagingResponse chatsChatIDMessagesGet()


### Example

```typescript
import {
    MessageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MessageApi(configuration);

let chatID: string; //Chat ID (default to undefined)
let limit: number; //Limit (optional) (default to undefined)
let cursor: string; //Cursor (optional) (default to undefined)

const { status, data } = await apiInstance.chatsChatIDMessagesGet(
    chatID,
    limit,
    cursor
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **chatID** | [**string**] | Chat ID | defaults to undefined|
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

