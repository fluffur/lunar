# CallApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**callStartPost**](#callstartpost) | **POST** /call/start | Start a direct call|

# **callStartPost**
> CallStartCallResponse callStartPost(input)


### Example

```typescript
import {
    CallApi,
    Configuration,
    CallStartCallRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new CallApi(configuration);

let input: CallStartCallRequest; //Call params

const { status, data } = await apiInstance.callStartPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **CallStartCallRequest**| Call params | |


### Return type

**CallStartCallResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

