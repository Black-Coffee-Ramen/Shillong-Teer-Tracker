export default function GameInfo() {
  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
      <h2 className="text-gray-800 font-poppins font-semibold mb-3">How to Play</h2>
      
      <ul className="space-y-3 text-gray-700">
        <li className="flex">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-3 flex-shrink-0">1</span>
          <p className="text-sm">Select any number between 00-99 for each round</p>
        </li>
        <li className="flex">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-3 flex-shrink-0">2</span>
          <p className="text-sm">Choose your betting amount (min ₹5)</p>
        </li>
        <li className="flex">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-3 flex-shrink-0">3</span>
          <p className="text-sm">Place your bet before the round closes</p>
        </li>
        <li className="flex">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-3 flex-shrink-0">4</span>
          <p className="text-sm">If your number matches the result, you win 80x your bet!</p>
        </li>
      </ul>
      
      <div className="mt-4 text-center">
        <a href="#" className="text-primary text-sm inline-block">
          View Complete Rules
          <i className="ri-arrow-right-s-line"></i>
        </a>
      </div>
    </div>
  );
}
