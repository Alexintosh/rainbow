import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, View } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import deviceUtils from '../../utils/deviceUtils';
import { CurrencySelectionList } from '../exchange';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { fetchSuggestions } from '@rainbow-me/handlers/ens';
import { useTimeout, useUniswapCurrencyList } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

export const SearchContainer = styled(Row)`
  height: 100%;
`;

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const dispatch = useDispatch();
  const {
    isFetchingEns,
    setIsSearching,
    setIsFetchingEns,
    searchQuery,
    isSearchModeEnabled,
  } = useContext(DiscoverSheetContext);

  const currencySelectionListRef = useRef();
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  const [ensResults, setEnsResults] = useState([]);
  const {
    uniswapCurrencyList,
    uniswapCurrencyListLoading,
  } = useUniswapCurrencyList(searchQueryForSearch);
  const currencyList = useMemo(() => [...uniswapCurrencyList, ...ensResults], [
    uniswapCurrencyList,
    ensResults,
  ]);

  const handlePress = useCallback(
    item => {
      if (item.ens) {
        // navigate to Showcase sheet
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.SHOWCASE_SHEET, {
            address: item.nickname,
          });
        });
      } else {
        const asset = ethereumUtils.getAccountAsset(item.uniqueId);
        dispatch(emitAssetRequest(item.address));
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        });
      }
    },
    [dispatch, navigate]
  );

  const handleActionAsset = useCallback(
    item => {
      navigate(Routes.ADD_TOKEN_SHEET, { item });
    },
    [navigate]
  );

  const itemProps = useMemo(
    () => ({
      onActionAsset: handleActionAsset,
      onPress: handlePress,
      showAddButton: true,
      showBalance: false,
    }),
    [handleActionAsset, handlePress]
  );

  const addEnsResults = useCallback(ensResults => {
    let ensSearchResults = [];
    if (ensResults && ensResults.length) {
      ensSearchResults = [
        {
          color: '#5893ff',
          data: ensResults,
          key: '􀏼 Ethereum Name Service',
          title: '􀏼 Ethereum Name Service',
        },
      ];
    }
    setEnsResults(ensSearchResults);
  }, []);

  useEffect(() => {
    const searching = searchQuery !== '';
    if (!searching) {
      setSearchQueryForSearch(searchQuery);
    }
    stopQueryDebounce();
    startQueryDebounce(
      () => {
        setIsSearching(true);
        setSearchQueryForSearch(searchQuery);
        fetchSuggestions(searchQuery, addEnsResults, setIsFetchingEns);
      },
      searchQuery === '' ? 1 : 500
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, setIsSearching, startQueryDebounce, stopQueryDebounce]);

  useEffect(() => {
    if (!uniswapCurrencyListLoading && !isFetchingEns) {
      setIsSearching(false);
    }
  }, [isFetchingEns, setIsSearching, uniswapCurrencyListLoading]);

  useEffect(() => {
    currencySelectionListRef.current?.scrollToLocation({
      animated: false,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }, [isSearchModeEnabled]);

  return (
    <View style={[!android && { height: deviceUtils.dimensions.height - 140 }]}>
      <SearchContainer>
        <CurrencySelectionList
          footerSpacer
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={uniswapCurrencyListLoading || isFetchingEns}
          query={searchQueryForSearch}
          ref={currencySelectionListRef}
          showList
          testID="discover-currency-select-list"
          type={CurrencySelectionTypes.output}
        />
      </SearchContainer>
    </View>
  );
}
