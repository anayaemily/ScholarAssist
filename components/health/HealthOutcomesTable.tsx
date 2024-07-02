import React from 'react';
import { HealthOutcomesSchemaType } from './HealthOutcomesSchema';



const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'A': return 'bg-green-500';
        case 'B': return 'bg-blue-500';
        case 'C': return 'bg-yellow-500';
        case 'D': return 'bg-orange-500';
        default: return 'bg-gray-500';
    }
};

const getEffectIcon = (text: string) => {
    const effect = text.toLowerCase();
    if (effect.indexOf("large") > -1) {
        return '📈';
    } if (effect.indexOf("moderate") > -1) {
        return '➖';
    } if (effect.indexOf("small") > -1) {
        return '❓';
    } return '❓';

};

export const HealthOutcomesTable: React.FC<HealthOutcomesSchemaType> = ({ outcomes = [] }) => {
    if (outcomes.length === 0) {
        return <div className="text-center py-4 text-gray-500">No data available</div>;
    }
    console.log(JSON.stringify(outcomes, null, 2))
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Outcome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effect</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {outcomes.map((outcome, index) => (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{outcome.outcome}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getGradeColor(outcome.grade)}`}>
                                    {outcome.grade}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{outcome.evidence} </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                    {getEffectIcon(outcome.effect)} <span className="ml-1">{outcome.effect}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

