export default function AISuggestions() {
  // In a real app, these suggestions would come from backend analysis
  const suggestedNumbers = [27, 43, 68, 92];
  
  return (
    <div className="bg-secondary rounded-xl p-4 mb-6 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white font-poppins font-semibold">AI Suggestions</h2>
        <span className="bg-blue-500 bg-opacity-20 text-blue-400 text-xs px-2 py-1 rounded-full">BETA</span>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-3 mb-3">
        <div className="flex items-start">
          <i className="ri-robot-line text-accent text-xl mr-2"></i>
          <div>
            <p className="text-white text-sm font-medium">Today's Suggestion</p>
            <p className="text-gray-400 text-sm mt-1">Based on historical patterns, these numbers have higher probability today:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestedNumbers.map(num => (
                <span key={num} className="bg-gray-700 text-white px-2 py-1 rounded text-sm font-mono">
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-500 text-xs text-center italic">AI predictions are based on historical data analysis and are not guarantees of winning results.</p>
    </div>
  );
}
