import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft,
  Search,
  Filter,
  AlertTriangle,
  Info,
  TrendingUp,
  Target,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const NoticePage = ({ user, onLogout }) => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Campus Recruitment Drive 2024",
      type: "Event",
      date: "2024-01-20",
      time: "10:00 AM - 2:00 PM",
      location: "Main Auditorium",
      description: "Annual campus recruitment drive with top companies. All final year students are required to attend.",
      targetTrade: "All Trades",
      urgency: "high",
      attendees: 150,
      maxAttendees: 200,
      status: "upcoming"
    },
    {
      id: 2,
      title: "Mock Interview Session",
      type: "TNP Meeting",
      date: "2024-01-22",
      time: "11:00 AM - 1:00 PM",
      location: "Interview Room",
      description: "Practice interview session to prepare students for upcoming placement drives.",
      targetTrade: "Computer Science Engineering",
      urgency: "medium",
      attendees: 45,
      maxAttendees: 60,
      status: "upcoming"
    },
    {
      id: 3,
      title: "Industry Expert Talk",
      type: "Event",
      date: "2024-01-25",
      time: "2:00 PM - 4:00 PM",
      location: "Room 101",
      description: "Guest lecture by industry experts on emerging technologies and career opportunities.",
      targetTrade: "Information Technology",
      urgency: "low",
      attendees: 78,
      maxAttendees: 100,
      status: "upcoming"
    },
    {
      id: 4,
      title: "Resume Building Workshop",
      type: "Event",
      date: "2024-01-28",
      time: "3:00 PM - 5:00 PM",
      location: "Computer Lab",
      description: "Learn how to create professional resumes that stand out to employers.",
      targetTrade: "All Trades",
      urgency: "medium",
      attendees: 92,
      maxAttendees: 120,
      status: "upcoming"
    },
    {
      id: 5,
      title: "Career Guidance Session",
      type: "TNP Meeting",
      date: "2024-02-01",
      time: "10:00 AM - 12:00 PM",
      location: "Conference Hall",
      description: "One-on-one career counseling sessions with TNP coordinators.",
      targetTrade: "All Trades",
      urgency: "low",
      attendees: 35,
      maxAttendees: 50,
      status: "upcoming"
    }
  ]);

  const [filteredEvents, setFilteredEvents] = useState(events);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const [stats, setStats] = useState({
    totalEvents: 15,
    upcomingEvents: 8,
    completedEvents: 7,
    totalAttendees: 1250
  });

  const eventTypes = ['All Types', 'Event', 'TNP Meeting'];
  const trades = [
    'All Trades',
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];
  const urgencyLevels = ['All Levels', 'high', 'medium', 'low'];

  useEffect(() => {
    filterEvents();
  }, [searchTerm, typeFilter, tradeFilter, urgencyFilter, events]);

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Trade filter
    if (tradeFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.targetTrade === tradeFilter || event.targetTrade === 'All Trades'
      );
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(event => event.urgency === urgencyFilter);
    }

    setFilteredEvents(filtered);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <Target className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type) => {
    return type === 'Event' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getAttendancePercentage = (attendees, maxAttendees) => {
    return Math.round((attendees / maxAttendees) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-7 h-7 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Notices & Events</h1>
            </div>
            
            {user?.role === 'admin' && (
              <Link
                to="/create-event"
                className="flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="hidden sm:inline">Create Event</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Events</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Upcoming</p>
                <p className="text-lg font-bold text-green-600">{stats.upcomingEvents}</p>
              </div>
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-purple-600">{stats.completedEvents}</p>
              </div>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Attendees</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalAttendees}</p>
              </div>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type === 'All Types' ? 'all' : type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {trades.map((trade) => (
                <option key={trade} value={trade === 'All Trades' ? 'all' : trade}>
                  {trade}
                </option>
              ))}
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {urgencyLevels.map((level) => (
                <option key={level} value={level === 'All Levels' ? 'all' : level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile Card View */}
              <div className="lg:hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(event.urgency)}`}>
                          {getUrgencyIcon(event.urgency)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {event.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.time}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Target: {event.targetTrade}</span>
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {event.attendees}/{event.maxAttendees}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${getAttendancePercentage(event.attendees, event.maxAttendees)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Desktop Card View */}
              <div className="hidden lg:block">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(event.urgency)}`}>
                          {getUrgencyIcon(event.urgency)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {event.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {event.time}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Target: {event.targetTrade}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end mb-2">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">
                          {event.attendees}/{event.maxAttendees}
                        </span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${getAttendancePercentage(event.attendees, event.maxAttendees)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getAttendancePercentage(event.attendees, event.maxAttendees)}% full
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticePage;
