export { UsersClient } from './UsersClient';
export { SearchUsersBuilder, GetUserGroupsBuilder } from './builders';
export { SearchUsersV2Builder } from './buildersV2';
export type {
  // V1 API (deprecated)
  User,
  UserWithDetails,
  UserGroup,
  GroupSelectionFilter,
  SearchUsersRequest,
  SearchUsersResponse,
  GetUserGroupsRequest,
  GetUserGroupsResponse,
  // V2 API
  UserV2,
  SearchUsersV2Request,
  SearchUsersV2Response,
} from './types';
