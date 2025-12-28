# ChatApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**chatsChatIDPost**](#chatschatidpost) | **POST** /chats/{chatID} | Join current user to chat|
|[**chatsPost**](#chatspost) | **POST** /chats | Create a new chat|

# **chatsChatIDPost**
> chatsChatIDPost()


### Example

```typescript
import {
    ChatApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ChatApi(configuration);

let chatID: string; //Chat ID (default to undefined)

const { status, data } = await apiInstance.chatsChatIDPost(
    chatID
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **chatID** | [**string**] | Chat ID | defaults to undefined|


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

# **chatsPost**
> ChatCreateResponse chatsPost(input)


### Example

```typescript
import {
    ChatApi,
    Configuration,
    ChatCreateParams
} from './api';

const configuration = new Configuration();
const apiInstance = new ChatApi(configuration);

let input: ChatCreateParams; //Chat creation params

const { status, data } = await apiInstance.chatsPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **ChatCreateParams**| Chat creation params | |


### Return type

**ChatCreateResponse**

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

