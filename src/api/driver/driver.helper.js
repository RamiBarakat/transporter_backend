/**
 * Driver Helper - Contains pure utility functions for driver operations
 * No database operations should be performed here
 */
class DriverHelper {

  analyzeRecentPerformance(ratings, recentCount = 5) {
    if (!ratings || ratings.length === 0) {
      return {
        trend: 'insufficient_data',
        message: 'Not enough data for trend analysis'
      };
    }

    const recentRatings = ratings.slice(0, Math.min(recentCount, ratings.length));
    const olderRatings = ratings.slice(recentCount);

    if (olderRatings.length === 0) {
      return {
        trend: 'new_driver',
        message: `Based on ${recentRatings.length} recent deliveries`,
        averageRating: this.calculateAverageRating(recentRatings)
      };
    }

    const recentAvg = this.calculateAverageRating(recentRatings);
    const olderAvg = this.calculateAverageRating(olderRatings);
    const difference = recentAvg - olderAvg;

    let trend, message;
    if (difference > 0.3) {
      trend = 'improving';
      message = 'Performance has improved significantly in recent deliveries';
    } else if (difference > 0.1) {
      trend = 'slightly_improving';
      message = 'Performance shows signs of improvement';
    } else if (difference < -0.3) {
      trend = 'declining';
      message = 'Performance has declined in recent deliveries';
    } else if (difference < -0.1) {
      trend = 'slightly_declining';
      message = 'Performance shows slight decline';
    } else {
      trend = 'stable';
      message = 'Performance remains consistent';
    }

    return {
      trend,
      message,
      recentAverage: parseFloat(recentAvg.toFixed(1)),
      previousAverage: parseFloat(olderAvg.toFixed(1)),
      difference: parseFloat(difference.toFixed(1))
    };
  }

  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + (rating.overall || 0), 0);
    return sum / ratings.length;
  }

  calculatePerformanceTrends(ratings) {
    if (!ratings || ratings.length < 3) {
      return {
        available: false,
        message: 'Insufficient data for trend analysis (minimum 3 ratings required)'
      };
    }

    // Calculate monthly trends if we have enough data
    const trends = {
      available: true,
      punctuality: this.calculateCategoryTrend(ratings, 'punctuality'),
      professionalism: this.calculateCategoryTrend(ratings, 'professionalism'),
      deliveryQuality: this.calculateCategoryTrend(ratings, 'deliveryQuality'),
      communication: this.calculateCategoryTrend(ratings, 'communication'),
      overall: this.calculateCategoryTrend(ratings, 'overall')
    };

    return trends;
  }

  calculateCategoryTrend(ratings, category) {
    const values = ratings
      .map(r => r[category] || r.overallRating)
      .filter(v => v > 0)
      .slice(0, 10); // Last 10 ratings

    if (values.length < 3) return 'insufficient_data';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.3) return 'improving';
    if (diff > 0.1) return 'slightly_improving';
    if (diff < -0.3) return 'declining';
    if (diff < -0.1) return 'slightly_declining';
    return 'stable';
  }

  generateBasicRecommendations(summary) {
    const recommendations = [];

    if (summary.averageOverall < 3) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Performance Improvement Required',
        description: 'Overall rating is below acceptable standards. Consider additional training or performance review.'
      });
    }

    if (summary.averagePunctuality < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'punctuality',
        title: 'Improve Time Management',
        description: 'Consider route optimization training and better scheduling practices.'
      });
    }

    if (summary.averageCommunication < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'communication',
        title: 'Enhance Communication Skills',
        description: 'Provide customer service training to improve client interactions.'
      });
    }

    if (summary.averageOverall >= 4.5) {
      recommendations.push({
        priority: 'low',
        category: 'recognition',
        title: 'Excellent Performance',
        description: 'Consider recognition programs or additional responsibilities for this high-performing driver.'
      });
    }

    return recommendations;
  }

  assessDriverRisk(summary, ratings) {
    let riskLevel = 'low';
    const riskFactors = [];

    // Check overall performance
    if (summary.averageOverall < 2.5) {
      riskLevel = 'high';
      riskFactors.push('Consistently poor overall ratings');
    } else if (summary.averageOverall < 3.5) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      riskFactors.push('Below-average overall performance');
    }

    // Check punctuality
    if (summary.averagePunctuality < 2.5) {
      riskLevel = 'high';
      riskFactors.push('Poor punctuality record');
    }

    // Check for negative comments
    if (ratings) {
      const negativeComments = ratings.filter(r => 
        r.comments && (
          r.comments.toLowerCase().includes('late') ||
          r.comments.toLowerCase().includes('problem') ||
          r.comments.toLowerCase().includes('issue') ||
          r.comments.toLowerCase().includes('poor') ||
          r.comments.toLowerCase().includes('bad')
        )
      ).length;

      if (negativeComments > ratings.length * 0.3) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        riskFactors.push('Multiple negative feedback comments');
      }
    }

    // Check delivery consistency
    if (summary.averageDeliveryQuality < 3) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      riskFactors.push('Inconsistent delivery quality');
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendation: this.getRiskRecommendation(riskLevel)
    };
  }

  getRiskRecommendation(riskLevel) {
    switch (riskLevel) {
      case 'high':
        return 'Immediate intervention required. Consider performance improvement plan or reassignment.';
      case 'medium':
        return 'Monitor closely and provide additional training or support as needed.';
      case 'low':
        return 'Continue regular monitoring. Driver performing within acceptable standards.';
      default:
        return 'Regular monitoring recommended.';
    }
  }


  formatDriverResponse(driver) {
    return {
      id: driver.id,
      name: driver.name,
      type: driver.type,
      transportCompany: driver.transportCompany,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      employeeId: driver.employeeId,
      department: driver.department,
      hireDate: driver.hireDate,
      overallRating: driver.overallRating,
      totalDeliveries: driver.totalDeliveries,
      lastDelivery: driver.lastDelivery,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };
  }

  calculateRatingSummary(ratings) {
    if (ratings.length === 0) {
      return {
        averageOverall: 0,
        averagePunctuality: 0,
        averageProfessionalism: 0,
        averageDeliveryQuality: 0,
        averageCommunication: 0,
        averageSafety: 0,
        totalRatings: 0
      };
    }

    const totals = ratings.reduce((acc, rating) => {
      acc.overall += rating.overallRating || 0;
      acc.punctuality += rating.punctuality || 0;
      acc.professionalism += rating.professionalism || 0;
      acc.deliveryQuality += rating.deliveryQuality || 0;
      acc.communication += rating.communication || 0;
      acc.safety += rating.safety || 0;
      return acc;
    }, {
      overall: 0,
      punctuality: 0,
      professionalism: 0,
      deliveryQuality: 0,
      communication: 0,
      safety: 0
    });

    const count = ratings.length;

    return {
      averageOverall: parseFloat((totals.overall / count).toFixed(1)),
      averagePunctuality: parseFloat((totals.punctuality / count).toFixed(1)),
      averageProfessionalism: parseFloat((totals.professionalism / count).toFixed(1)),
      averageDeliveryQuality: parseFloat((totals.deliveryQuality / count).toFixed(1)),
      averageCommunication: parseFloat((totals.communication / count).toFixed(1)),
      averageSafety: parseFloat((totals.safety / count).toFixed(1)),
      totalRatings: count
    };
  }

  formatRatingWithContext(rating) {
    return {
      id: rating.id,
      punctuality: rating.punctuality,
      professionalism: rating.professionalism,
      deliveryQuality: rating.deliveryQuality,
      communication: rating.communication,
      safety: rating.safety,
      policyCompliance: rating.policyCompliance,
      fuelEfficiency: rating.fuelEfficiency,
      overall: rating.overallRating,
      comments: rating.comments,
      ratedAt: rating.Delivery.created_at,
      delivery: {
        id: rating.Delivery.id,
        actualPickupDateTime: rating.Delivery.actualPickupDateTime,
        actualTruckCount: rating.Delivery.actualTruckCount,
        invoiceAmount: rating.Delivery.invoiceAmount,
        deliveryNotes: rating.Delivery.deliveryNotes,
        loggedAt: rating.Delivery.loggedAt
      },
      request: {
        id: rating.Delivery.TransportationRequest.id,
        requestNumber: rating.Delivery.TransportationRequest.requestNumber,
        origin: rating.Delivery.TransportationRequest.origin,
        destination: rating.Delivery.TransportationRequest.destination,
        pickUpDateTime: rating.Delivery.TransportationRequest.pickUpDateTime,
        truckCount: rating.Delivery.TransportationRequest.truckCount,
        truckType: rating.Delivery.TransportationRequest.truckType
      }
    };
  }


}

module.exports = DriverHelper;