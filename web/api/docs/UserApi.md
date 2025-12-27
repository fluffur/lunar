# UserApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**usersMeAvatarPost**](#usersmeavatarpost) | **POST** /users/me/avatar | Upload user avatar|
|[**usersMeEmailPut**](#usersmeemailput) | **PUT** /users/me/email | Update user email|
|[**usersMeGet**](#usersmeget) | **GET** /users/me | Get current user|
|[**usersMePasswordPut**](#usersmepasswordput) | **PUT** /users/me/password | Change user password|
|[**usersMeVerificationCodePost**](#usersmeverificationcodepost) | **POST** /users/me/verification-code | Send verification code|

# **usersMeAvatarPost**
> usersMeAvatarPost()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let avatar: File; //Avatar file (default to undefined)

const { status, data } = await apiInstance.usersMeAvatarPost(
    avatar
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **avatar** | [**File**] | Avatar file | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersMeEmailPut**
> usersMeEmailPut(input)


### Example

```typescript
import {
    UserApi,
    Configuration,
    UserUpdateEmailRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let input: UserUpdateEmailRequest; //Email update request

const { status, data } = await apiInstance.usersMeEmailPut(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **UserUpdateEmailRequest**| Email update request | |


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersMeGet**
> UserSuccessResponse usersMeGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

const { status, data } = await apiInstance.usersMeGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**UserSuccessResponse**

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
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersMePasswordPut**
> usersMePasswordPut(input)


### Example

```typescript
import {
    UserApi,
    Configuration,
    UserUpdatePasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let input: UserUpdatePasswordRequest; //Password change request

const { status, data } = await apiInstance.usersMePasswordPut(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **UserUpdatePasswordRequest**| Password change request | |


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersMeVerificationCodePost**
> usersMeVerificationCodePost(input)


### Example

```typescript
import {
    UserApi,
    Configuration,
    UserSendVerificationCodeRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let input: UserSendVerificationCodeRequest; //Verification request

const { status, data } = await apiInstance.usersMeVerificationCodePost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **UserSendVerificationCodeRequest**| Verification request | |


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

