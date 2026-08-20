import React from 'react';

interface Player {
  id: string;
  name: string;
  dateOfBirth: string;
  password?: string;
}

interface PlayerRosterProps {
  players: Player[];
}

const PlayerRoster: React.FC<PlayerRosterProps> = ({ players }) => {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-400">선수 명단</h2>
      {players.length === 0 ? (
        <p className="text-center text-gray-400">등록된 선수가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-sm text-gray-300 uppercase tracking-wider">선수 이름</th>
                <th className="px-4 py-3 font-semibold text-sm text-gray-300 uppercase tracking-wider">생년월일</th>
                <th className="px-4 py-3 font-semibold text-sm text-gray-300 uppercase tracking-wider">아이디</th>
                <th className="px-4 py-3 font-semibold text-sm text-gray-300 uppercase tracking-wider">비밀번호</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {players.map(player => (
                <tr key={player.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{player.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{player.dateOfBirth}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{player.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{player.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayerRoster;