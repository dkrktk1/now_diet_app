import React from 'react';

interface Player {
  id: string;
  name: string;
}

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ players, selectedPlayerId, onSelectPlayer }) => {
  if (players.length === 0) {
    return <p className="text-center text-yellow-400 mb-6">등록된 선수가 없습니다. 선수들이 회원가입을 해야 목록에 표시됩니다.</p>;
  }

  return (
    <div className="mb-6">
      <label htmlFor="player-select" className="block text-lg font-medium text-gray-300 mb-2">선수 선택:</label>
      <select
        id="player-select"
        value={selectedPlayerId || ''}
        onChange={(e) => onSelectPlayer(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
      >
        {players.map(player => (
          <option key={player.id} value={player.id}>
            {player.name} ({player.id})
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlayerSelector;
