import { IVideo } from '@consumet/extensions';

import { ListAnimeData } from '../../types/anilistAPITypes';
import { animeCustomTitles } from '../animeCustomTitles';
import { getParsedAnimeTitles } from '../utils';
import { getEpisodeUrl as animeunity } from './animeunity';
import { getEpisodeUrl as gogoanime } from './gogoanime';
import { STORAGE } from '../storage';

export const getBestQualityVideo = (videos: IVideo[]): IVideo => {
  const qualityOrder = ['1080p', '720p', '480p', '360p', 'default', 'backup'];

  videos.sort((a, b) => {
    const indexA = qualityOrder.indexOf(a.quality || 'default');
    const indexB = qualityOrder.indexOf(b.quality || 'default');

    if (indexA < indexB) return -1;
    if (indexA > indexB) return 1;
    return 0;
  });

  return videos[0];
};

export const getDefaultQualityVideo = (videos: IVideo[]): IVideo =>
  videos.find(video => video.quality === 'default') ??
  getBestQualityVideo(videos);

/**
 * Gets the episode url and isM3U8 flag, with stored language and dubbed
 *
 * @param listAnimeData
 * @param episode
 * @returns
 */
export const getUniversalEpisodeUrl = async (
  listAnimeData: ListAnimeData,
  episode: number
): Promise<IVideo | null> => {
  const lang = await STORAGE.getSourceFlag();
  const dubbed = await STORAGE.getDubbed();

  const customTitle = listAnimeData.media.id
    ? animeCustomTitles[lang][listAnimeData.media.id]
    : null;

  const animeTitles = getParsedAnimeTitles(listAnimeData.media);
  if (customTitle) animeTitles.unshift(customTitle.title);

  // customTitle
  //   ? (animeTitles = [customTitle.title])
  //   : (animeTitles = getParsedAnimeTitles(listAnimeData.media));

  console.log(`${lang} ${dubbed} ${customTitle?.title}`);

  switch (lang) {
    case 'IT': {
      const animteUnityData = await animeunity(
        animeTitles,
        customTitle && !dubbed ? customTitle.index : 0,
        episode,
        dubbed
      );
      return animteUnityData ? getDefaultQualityVideo(animteUnityData) : null; // change when animeunity api updates
    }
    case 'US':
    default: {
      const gogoAnimeData = await gogoanime(
        animeTitles,
        customTitle && !dubbed ? customTitle.index : 0,
        episode,
        dubbed
      );
      return gogoAnimeData ? getDefaultQualityVideo(gogoAnimeData) : null;
    }
  }
};
