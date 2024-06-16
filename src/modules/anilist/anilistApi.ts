import { app } from 'electron';
import {
  AnimeData,
  CurrentListAnime,
  MostPopularAnime,
  TrendingAnime
} from '../../types/anilistAPITypes';
import { MediaListStatus } from '../../types/anilistGraphQLTypes';
import { ClientData } from '../../types/types';
import { clientData } from '../clientData';
import isAppImage from '../packaging/isAppImage';
import { getOptions, makeRequest } from '../requests';

const CLIENT_DATA: ClientData = clientData;
const PAGES: number = 20;
const METHOD: string = 'POST';
const GRAPH_QL_URL: string = 'https://graphql.anilist.co';
const HEADERS: object = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};
const MEDIA_DATA: string = `
        id
        title {
            romaji
            english
            native
            userPreferred
        }
        format
        status
        description
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        season
        seasonYear
        episodes
        duration
        coverImage {
            large
            extraLarge
            color
        }
        bannerImage
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        isAdult
        nextAiringEpisode {
            id
            timeUntilAiring
            episode
        }
        mediaListEntry {
            id
            mediaId
            status
            score(format:POINT_10)
            progress
        }
        siteUrl
        trailer {
            id
            site
            thumbnail
        }
    `;

/**
 * Retrieves the access token for the api
 *
 * @param {*} code
 * @returns access token
 */
export const fetchAccessToken = async (code: string): Promise<string> => {
  const url = 'https://anilist.co/api/v2/oauth/token';

  const data = {
    grant_type: 'authorization_code',
    client_id: CLIENT_DATA.clientId,
    client_secret: CLIENT_DATA.clientSecret,
    redirect_uri:
      isAppImage || !app.isPackaged
        ? 'https://anilist.co/api/v2/oauth/pin'
        : clientData.redirectUri,
    code
  };

  const respData = await makeRequest(METHOD, url, HEADERS, data);
  console.log(respData);
  return respData.access_token;
};

/**
 * Gets the anilist viewer (user) id
 *
 * @returns viewer id
 */
export const getViewerId = async (accessToken: string): Promise<number> => {
  const query = `
          query {
              Viewer {
                  id
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Viewer.id;
};

/**
 * Gets the viewer (user) info
 *
 * @param {*} viewerId
 * @returns object with viewer info
 */
export const getViewerInfo = async (
  accessToken: string,
  viewerId: number | null
) => {
  const query = `
          query($userId : Int) {
              User(id: $userId, sort: ID) {
                  id
                  name
                  avatar {
                      medium
                  }
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const variables = {
    userId: viewerId
  };

  const options = getOptions(query, variables);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.User;
};

/**
 * Gets a viewer list (current, completed...)
 *
 * @param {*} viewerId
 * @param {*} status
 * @returns object with anime entries
 */
export const getViewerList = async (
  accessToken: string,
  viewerId: number,
  status: MediaListStatus
): Promise<CurrentListAnime> => {
  const query = `
          query($userId : Int) {
              MediaListCollection(userId : $userId, type: ANIME, status : ${status}, sort: UPDATED_TIME_DESC) {
                  lists {
                      isCustomList
                      name
                      entries {
                          id
                          mediaId
                          progress
                          media {
                              ${MEDIA_DATA}
                          }
                      }
                  }
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const variables = {
    userId: viewerId
  };

  const options = getOptions(query, variables);

  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.MediaListCollection.lists.length === 0
    ? []
    : respData.data.MediaListCollection.lists[0].entries;
};

// NOT WORKING
export const getFollowingUsers = async (accessToken: string, viewerId: any) => {
  const query = `
          query($userId : Int) {
              User(id: $userId, sort: ID) {
                  id
                  name
                  avatar {
                      large
                  }
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const variables = {
    userId: viewerId
  };

  const options = getOptions(query, variables);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);
  return respData.data;
};

/**
 * Gets the info from an anime
 *
 * @param {*} animeId
 * @returns object with anime info
 */
export const getAnimeInfo = async (accessToken: string, animeId: any) => {
  const query = `
          query($id: Int) {
              Media(id: $id, type: ANIME) {
                  ${MEDIA_DATA}
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const variables = {
    id: animeId
  };

  const options = getOptions(query, variables);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Media;
};

/**
 * Gets the current trending animes on anilist
 * pass viewerId to make an authenticated request
 *
 * @param {*} viewerId
 * @returns object with trending animes
 */
export const getTrendingAnime = async (
  accessToken: string,
  viewerId: number | null
): Promise<TrendingAnime> => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(sort: TRENDING_DESC, type: ANIME) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const headers: any = {
    Authorization:
      accessToken && viewerId ? `Bearer ${accessToken}` : undefined,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);
  return respData.data.Page;
};

/**
 * Gets the current most popular animes on anilist
 * pass viewerId to make an authenticated request
 *
 * @param {*} viewerId
 * @returns object with most popular animes
 */
export const getMostPopularAnime = async (
  accessToken: string,
  viewerId: number | null
): Promise<MostPopularAnime> => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(sort: POPULARITY_DESC, type: ANIME) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const headers: any = {
    Authorization:
      accessToken && viewerId ? `Bearer ${accessToken}` : undefined,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Page;
};

/**
 * Gets the next anime releases
 *
 * @returns object with next anime releases
 */
export const getNextReleases = async (
  accessToken: string,
  viewerId: number | null
) => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const headers: any = {
    Authorization:
      accessToken && viewerId ? `Bearer ${accessToken}` : undefined,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Page;
};

/**
 * Gets searched anime with filters
 *
 * @param {*} args
 * @returns object with the searched filtered anime
 */
export const searchFilteredAnime = async (
  args: string,
  accessToken: string,
  viewerId: number | null
): Promise<AnimeData> => {
  const query = `
      {
          Page(page: 1, perPage: 50) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(${args}) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const headers: any = {
    Authorization:
      accessToken && viewerId ? `Bearer ${accessToken}` : undefined,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Page;
};

/**
 * Gets the next anime releases
 *
 * @returns object with next anime releases
 */
export const releasingAnimes = async () => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(status: RELEASING, sort: POPULARITY_DESC, type: ANIME) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, HEADERS, options);

  return respData.data.Page;
};

/**
 * Gets the current trending animes filtered by a genre
 * pass viewerId to make an authenticated request
 *
 * @param {*} genre
 * @param {*} viewerId
 * @returns object with animes entries filtered by genre
 */
export const getAnimesByGenre = async (
  genre: any,
  accessToken: string,
  viewerId: number | null
) => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  hasNextPage
              }
              media(genre: "${genre}", sort: TRENDING_DESC, type: ANIME) {
                  ${MEDIA_DATA}
              }
          } 
      }
      `;

  const headers: any = {
    Authorization:
      accessToken && viewerId ? `Bearer ${accessToken}` : undefined,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  return respData.data.Page;
};

/**
 * Gets anime entries from a search query
 *
 * @param {*} input
 * @returns object with searched animes
 */
export const getSearchedAnimes = async (input: any) => {
  const query = `
      {
          Page(page: 1, perPage: ${PAGES}) {
              pageInfo {
                  total
                  currentPage
                  lastPage
                  hasNextPage
                  perPage
              }
              media(search: "${input}", type: ANIME, sort: SEARCH_MATCH) {
                  ${MEDIA_DATA}
              }
          }
      }
      `;

  const options = getOptions(query);
  const respData = await makeRequest(METHOD, GRAPH_QL_URL, HEADERS, options);

  return respData.data.Page.media;
};

/* MUTATIONS */

/**
 * Updates a media entry list
 *
 * @param accessToken
 * @param mediaId
 * @param status
 * @param scoreRaw
 * @param progress
 * @returns media list entry id
 */
export const updateAnimeFromList = async (
  accessToken: string,
  mediaId: any,
  status?: any,
  scoreRaw?: any,
  progress?: any
): Promise<number | null> => {
  try {
    const query = `
          mutation($mediaId: Int${progress ? ', $progress: Int' : ''}${scoreRaw ? ', $scoreRaw: Int' : ''}${status ? ', $status: MediaListStatus' : ''}) {
              SaveMediaListEntry(mediaId: $mediaId${progress ? ', progress: $progress' : ''}${scoreRaw ? ', scoreRaw: $scoreRaw' : ''}${status ? ', status: $status' : ''}) {
                  id
              }
          }
      `;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    const variables: any = {
      mediaId
    };

    if (status !== undefined) variables.status = status;
    if (scoreRaw !== undefined) variables.scoreRaw = scoreRaw;
    if (progress !== undefined) variables.progress = progress;

    const options = getOptions(query, variables);
    const respData = await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

    console.log(
      `Anime list updated (status: ${status},score: ${scoreRaw},progress: ${progress}) for list ${mediaId}`
    );

    return respData.data.SaveMediaListEntry.id;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const deleteAnimeFromList = async (
  accessToken: string,
  id: any
): Promise<boolean> => {
  try {
    const query = `
          mutation($id: Int){
              DeleteMediaListEntry(id: $id){
                  deleted
              }
          }
      `;

    console.log('delte: ', id);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    const variables = {
      id
    };

    const options = getOptions(query, variables);
    return await makeRequest(METHOD, GRAPH_QL_URL, headers, options);
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * Updates the progress of an anime on list
 *
 * @param {*} mediaId
 * @param {*} progress
 */
export const updateAnimeProgress = async (
  accessToken: string,
  mediaId: number,
  progress: number
) => {
  const query = `
          mutation($mediaId: Int, $progress: Int) {
              SaveMediaListEntry(mediaId: $mediaId, progress: $progress) {
                  id
                  progress
              }
          }
      `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const variables = {
    mediaId,
    progress
  };

  const options = getOptions(query, variables);
  await makeRequest(METHOD, GRAPH_QL_URL, headers, options);

  console.log(`Progress updated (${progress}) for anime ${mediaId}`);
};
