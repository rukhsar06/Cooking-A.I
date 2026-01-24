
import '../styles/history.css';
import FoodList from '../pages/FoodList.jsx';
function History() {
    return (
        <>
        <div className="history-header">
                <h3 className='p-h'>Your History</h3>
                <FoodList type="history"/>
        </div>
        </>
    );
}

export default History;