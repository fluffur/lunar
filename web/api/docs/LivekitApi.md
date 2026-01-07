# LivekitApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**livekitTokenRoomSlugGet**](#livekittokenroomslugget) | **GET** /livekit/token/{roomSlug} | Get livekit access token|

# **livekitTokenRoomSlugGet**
> LivekitTokenResponse livekitTokenRoomSlugGet()


### Example

```typescript
import {
    LivekitApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LivekitApi(configuration);

let roomSlug: string; //Room Slug (default to undefined)

const { status, data } = await apiInstance.livekitTokenRoomSlugGet(
    roomSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roomSlug** | [**string**] | Room Slug | defaults to undefined|


### Return type

**LivekitTokenResponse**

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

