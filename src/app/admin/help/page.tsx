// TeamPage.tsx
import React from 'react';

interface TeamMember {
  name: string;
  designation: string;
  email: string;
  phone: string;
}

const TeamPage: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "Sarojini Gude",
      designation: "President",
      email: "sgude@oceanbluecorp.com",
      phone: ""
    },
    {
      name: "Ravi OceanBlue",
      designation: "Chief Operating Officer",
      email: "ravi@oceanbluecorp.com",
      phone: "+1 (614) 352-0189"
    },
    {
      name: "Sushma Moturu",
      designation: "Global HR",
      email: "hr@oceanbluecorp.com",
      phone: "+1 (614) 352-2777"
    },
    {
      name: "Harika Kalam",
      designation: "HR Coordinator",
      email: "services@oceanbluecorp.com",
      phone: "+1 (614) 352-2701"
    },
    {
      name: "Venky Tadikonda",
      designation: "Executive Recruiter",
      email: "venky@oceanbluecorp.com",
      phone: "+1 (614) 352-2668"
    },
    {
      name: "Susmitha Pampana",
      designation: "Senior Recruiter",
      email: "susmitha@oceanbluecorp.com",
      phone: "+1 (614) 352-2527"
    },
    {
      name: "Brent Wallace",
      designation: "Sr. Vice President - Sales",
      email: "bwallace@oceanbluecorp.com",
      phone: "+1 (614) 352-2701"
    },
    {
      name: "Clark A Cristolfoli",
      designation: "Executive Recruiter",
      email: "clark@oceanbluecorp.com",
      phone: "+1 (614) 352-2759"
    },
    {
      name: "Raja Kethineni",
      designation: "Executive Recruiter",
      email: "raja@oceanbluecorp.com",
      phone: "+1 (614) 352-2877"
    }
  ];

  const TeamCard: React.FC<{ member: TeamMember }> = ({ member }) => {
    // Generate initials from name
    const initials = member.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
        <div className="p-6">
          {/* Header with Avatar */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.name}
              </h3>
              <p className="text-sm text-blue-600 font-medium">
                {member.designation}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {/* Email */}
            <div className="flex items-center text-sm">
              <svg 
                className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              <a 
                href={`mailto:${member.email}`}
                className="text-gray-600 hover:text-blue-600 truncate"
                title={member.email}
              >
                {member.email}
              </a>
            </div>

            {/* Phone */}
            <div className="flex items-center text-sm">
              <svg 
                className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                />
              </svg>
              <a 
                href={`tel:${member.phone}`}
                className="text-gray-600 hover:text-blue-600"
              >
                {member.phone}
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex space-x-2">
            <a
              href={`mailto:${member.email}`}
              className="flex-1 bg-blue-50 text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-center"
            >
              Email
            </a>
            <a
              href={`tel:${member.phone}`}
              className="flex-1 bg-green-50 text-green-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-green-100 transition-colors duration-200 text-center"
            >
              Call
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Team
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet our dedicated team of professionals committed to excellence
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <TeamCard key={index} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;