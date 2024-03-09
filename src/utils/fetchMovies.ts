import {
    API_PARAM_R,
    OMDB_API_BASE_URL,
    OMDB_API_KEY,
} from '../constants/constants';
import {
    MovieItemInfo,
    MovieListState,
    MovieType,
    SearchTerms,
} from '../types/type';
import { mapMovieTypeToApiParam } from './utils';

export const fetchMoviesApi = async (
    searchTerms: SearchTerms,
    movieList: Array<MovieItemInfo>,
): Promise<MovieListState> => {
    const { title, type, page } = searchTerms;

    const queryParams = new URLSearchParams({
        apikey: OMDB_API_KEY,
        s: title?.trim() ?? '',
        ...(type != null &&
            type !== MovieType.Any && { type: mapMovieTypeToApiParam(type) }),
        r: API_PARAM_R,
        page: page ? page.toString() : '1',
    });
    const listURL = `${OMDB_API_BASE_URL}?${queryParams.toString()}`;

    let responseState: MovieListState = {
        movieList: [],
        isLoading: true,
        error: '',
        canLoadMore: true,
    };

    try {
        const response = await fetch(listURL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.Response === 'True') {
            const newList = data.Search as Array<MovieItemInfo>;
            responseState = {
                movieList: page > 1 ? movieList.concat(newList) : newList,
                response: data.Response,
                totalResult: parseInt(data.totalResults, 10),
                error: '',
                canLoadMore: true,
                isLoading: false,
            };
        } else if (data.Response === 'False') {
            // If page more than 1, false response means reach the end of search results.
            if (page > 1) {
                return {
                    movieList: movieList,
                    response: data.Response,
                    totalResult: data.totalResults,
                    canLoadMore: false,
                    isLoading: false,
                };
            }
            return {
                movieList: [],
                response: data.Response,
                totalResult: 0,
                canLoadMore: false,
                isLoading: false,
            };
        } else {
            throw new Error(data.Error || 'Unknown error from API');
        }
    } catch (err) {
        throw err instanceof Error
            ? err.message
            : new Error('An unknown error occurred');
    }

    return responseState;
};
