import { MobXProviderContext } from 'mobx-react';
import { useEffect, useMemo, useContext } from 'react';

const useTokenPairsInfo = (tokenPairId, chainType) => {
  const { crossChain } = useContext(MobXProviderContext)

  useEffect(() => {
    crossChain.setCurrSymbol(chainType);
    crossChain.setCurrTokenPairId(tokenPairId)
  }, [chainType, tokenPairId])

  return useMemo(() => crossChain.tokenPairs[tokenPairId], [crossChain.tokenPairs, tokenPairId])
}

export default useTokenPairsInfo;
