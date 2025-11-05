import React from 'react'

const Card = ({ 
  children, 
  className = '',
  padding = 'medium',
  hover = false,
  ...props 
}) => {
  const paddings = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }

  const styles = `
    bg-white rounded-lg border border-gray-200 shadow-sm
    ${paddings[padding]}
    ${hover ? 'hover:shadow-md transition-shadow' : ''}
    ${className}
  `

  return (
    <div className={styles} {...props}>
      {children}
    </div>
  )
}

export default Card