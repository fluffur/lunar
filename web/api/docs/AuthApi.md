# AuthApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authLoginPost**](#authloginpost) | **POST** /auth/login | Login a user|
|[**authLogoutPost**](#authlogoutpost) | **POST** /auth/logout | Logout a user|
|[**authRefreshPost**](#authrefreshpost) | **POST** /auth/refresh | Refresh access token|
|[**authRegisterPost**](#authregisterpost) | **POST** /auth/register | Register a new user|
|[**authVerifyPost**](#authverifypost) | **POST** /auth/verify | Verify email|
|[**authVerifyResendPost**](#authverifyresendpost) | **POST** /auth/verify/resend | Resend verification code|

# **authLoginPost**
> AuthTokens authLoginPost(input)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthLoginCredentials
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let input: AuthLoginCredentials; //Login credentials

const { status, data } = await apiInstance.authLoginPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **AuthLoginCredentials**| Login credentials | |


### Return type

**AuthTokens**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authLogoutPost**
> authLogoutPost()


### Example

```typescript
import {
    AuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

const { status, data } = await apiInstance.authLogoutPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRefreshPost**
> AuthTokens authRefreshPost()


### Example

```typescript
import {
    AuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

const { status, data } = await apiInstance.authRefreshPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**AuthTokens**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRegisterPost**
> authRegisterPost(input)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthRegisterCredentials
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let input: AuthRegisterCredentials; //Registration credentials

const { status, data } = await apiInstance.authRegisterPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **AuthRegisterCredentials**| Registration credentials | |


### Return type

void (empty response body)

### Authorization

No authorization required

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

# **authVerifyPost**
> authVerifyPost(input)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthVerifyEmailRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let input: AuthVerifyEmailRequest; //Verification credentials

const { status, data } = await apiInstance.authVerifyPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **AuthVerifyEmailRequest**| Verification credentials | |


### Return type

void (empty response body)

### Authorization

No authorization required

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

# **authVerifyResendPost**
> authVerifyResendPost(input)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthResendVerificationCodeRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let input: AuthResendVerificationCodeRequest; //Email

const { status, data } = await apiInstance.authVerifyResendPost(
    input
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **input** | **AuthResendVerificationCodeRequest**| Email | |


### Return type

void (empty response body)

### Authorization

No authorization required

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

